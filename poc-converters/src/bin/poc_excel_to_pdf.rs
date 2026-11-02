use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::time::Instant;

#[derive(Debug, PartialEq)]
pub enum ExcelEngine {
    LibreOffice(PathBuf),
    WindowsExcelCom,
    None,
}

pub fn detect_excel_engine() -> ExcelEngine {
    // 1. Check LibreOffice
    let lo_candidates = [
        PathBuf::from("C:\\Program Files\\LibreOffice\\program\\soffice.exe"),
        PathBuf::from("C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe"),
    ];

    for path in &lo_candidates {
        if path.exists() {
            return ExcelEngine::LibreOffice(path.clone());
        }
    }

    if let Ok(output) = Command::new("where.exe").arg("soffice").output() {
        if output.status.success() {
            let s = String::from_utf8_lossy(&output.stdout).trim().to_string();
            if !s.is_empty() {
                return ExcelEngine::LibreOffice(PathBuf::from(s));
            }
        }
    }

    // 2. Check Windows Excel COM
    let excel_exe = PathBuf::from("C:\\Program Files\\Microsoft Office\\root\\Office16\\EXCEL.EXE");
    if excel_exe.exists() {
        return ExcelEngine::WindowsExcelCom;
    }

    let com_check = Command::new("powershell")
        .args([
            "-NoProfile",
            "-Command",
            "$x = New-Object -ComObject Excel.Application -ErrorAction SilentlyContinue; if ($x) { $x.Quit(); exit 0 } else { exit 1 }",
        ])
        .output();

    if let Ok(out) = com_check {
        if out.status.success() {
            return ExcelEngine::WindowsExcelCom;
        }
    }

    ExcelEngine::None
}

pub fn convert_excel_to_pdf(input_path: &str, output_path: &str) -> Result<(u128, u64, usize), Box<dyn std::error::Error>> {
    let start = Instant::now();
    let in_file = Path::new(input_path);
    if !in_file.exists() {
        return Err(format!("Input file not found: {}", input_path).into());
    }

    let ext = in_file
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();
    if ext != "xlsx" && ext != "xls" && ext != "csv" {
        return Err(format!("Unsupported format: .{}", ext).into());
    }

    let abs_in = fs::canonicalize(in_file)?;
    let clean_in = abs_in.to_string_lossy().trim_start_matches(r"\\?\").replace('/', "\\");

    let out_file = PathBuf::from(output_path);
    let out_dir = out_file.parent().unwrap_or(Path::new("."));
    if !out_dir.exists() {
        fs::create_dir_all(out_dir)?;
    }
    let abs_out_dir = fs::canonicalize(out_dir)?;
    let clean_out_dir = abs_out_dir.to_string_lossy().trim_start_matches(r"\\?\").replace('/', "\\");
    let file_name = out_file.file_name().unwrap_or_default().to_string_lossy();
    let clean_out = format!("{}\\{}", clean_out_dir, file_name);

    let engine = detect_excel_engine();

    match engine {
        ExcelEngine::LibreOffice(soffice_path) => {
            let status = Command::new(soffice_path)
                .arg("--headless")
                .arg("--convert-to")
                .arg("pdf")
                .arg("--outdir")
                .arg(&clean_out_dir)
                .arg(&clean_in)
                .status()?;

            if !status.success() {
                return Err("LibreOffice returned non-zero status".into());
            }

            let lo_default_out = PathBuf::from(&clean_out_dir)
                .join(in_file.file_stem().unwrap_or_default())
                .with_extension("pdf");
            if lo_default_out.exists() && lo_default_out != PathBuf::from(&clean_out) {
                let _ = fs::rename(&lo_default_out, &clean_out);
            }
        }
        ExcelEngine::WindowsExcelCom => {
            let script = format!(
                "$excel = New-Object -ComObject Excel.Application; \
                 $excel.Visible = $false; \
                 $excel.DisplayAlerts = $false; \
                 try {{ \
                     $wb = $excel.Workbooks.Open('{clean_in}'); \
                     $wb.ExportAsFixedFormat(0, '{clean_out}'); \
                     $wb.Close($false); \
                 }} finally {{ \
                     $excel.Quit(); \
                     [System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null; \
                 }}",
                clean_in = clean_in.replace('\\', "\\\\"),
                clean_out = clean_out.replace('\\', "\\\\"),
            );

            let status = Command::new("powershell")
                .args(["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", &script])
                .status()?;

            if !status.success() {
                return Err("Excel COM automation failed".into());
            }
        }
        ExcelEngine::None => {
            return Err("Neither LibreOffice nor Microsoft Excel is available on this system".into());
        }
    }

    if !Path::new(&clean_out).exists() {
        return Err("PDF output file was not generated".into());
    }

    let meta = fs::metadata(&clean_out)?;
    let doc = lopdf::Document::load(&clean_out)?;
    let pages = doc.get_pages().len();

    Ok((start.elapsed().as_millis(), meta.len(), pages))
}

fn main() {
    println!("=== Testing PoC Excel to PDF ===");

    let detected = detect_excel_engine();
    println!("Detected Engine: {:?}", detected);

    let sample_csv = if Path::new("poc-converters/fixtures/sample.csv").exists() {
        "poc-converters/fixtures/sample.csv"
    } else {
        "fixtures/sample.csv"
    };
    let out_csv_pdf = if Path::new("poc-converters").exists() {
        "poc-converters/output/poc_csv_converted.pdf"
    } else {
        "output/poc_csv_converted.pdf"
    };

    if Path::new(sample_csv).exists() {
        match convert_excel_to_pdf(sample_csv, out_csv_pdf) {
            Ok((ms, size, pages)) => {
                println!("CSV -> PDF SUCCESS: {} ms, {} bytes, {} pages", ms, size, pages);
            }
            Err(e) => println!("CSV -> PDF FAILED: {}", e),
        }
    }

    let sample_xlsx = if Path::new("poc-converters/fixtures/sample.xlsx").exists() {
        "poc-converters/fixtures/sample.xlsx"
    } else {
        "fixtures/sample.xlsx"
    };
    let out_xlsx_pdf = if Path::new("poc-converters").exists() {
        "poc-converters/output/poc_xlsx_converted.pdf"
    } else {
        "output/poc_xlsx_converted.pdf"
    };

    if Path::new(sample_xlsx).exists() {
        match convert_excel_to_pdf(sample_xlsx, out_xlsx_pdf) {
            Ok((ms, size, pages)) => {
                println!("XLSX -> PDF SUCCESS: {} ms, {} bytes, {} pages", ms, size, pages);
            }
            Err(e) => println!("XLSX -> PDF FAILED: {}", e),
        }
    }
}
