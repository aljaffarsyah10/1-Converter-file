use crate::errors::AppError;
use crate::models::{ConversionResult, SystemEngineInfo};
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

pub fn detect_excel_engine() -> (ExcelEngine, SystemEngineInfo) {
    let mut lo_path = None;
    let mut excel_com = false;

    // 1. Check LibreOffice
    let lo_candidates = [
        PathBuf::from("C:\\Program Files\\LibreOffice\\program\\soffice.exe"),
        PathBuf::from("C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe"),
    ];

    for path in &lo_candidates {
        if path.exists() {
            lo_path = Some(path.clone());
            break;
        }
    }

    if lo_path.is_none() {
        if let Ok(output) = Command::new("where.exe").arg("soffice").output() {
            if output.status.success() {
                let s = String::from_utf8_lossy(&output.stdout).trim().to_string();
                if !s.is_empty() {
                    lo_path = Some(PathBuf::from(s));
                }
            }
        }
    }

    // 2. Check Windows Excel COM
    let excel_exe = PathBuf::from("C:\\Program Files\\Microsoft Office\\root\\Office16\\EXCEL.EXE");
    if excel_exe.exists() {
        excel_com = true;
    } else {
        let com_check = Command::new("powershell")
            .args([
                "-NoProfile",
                "-Command",
                "$x = New-Object -ComObject Excel.Application -ErrorAction SilentlyContinue; if ($x) { $x.Quit(); exit 0 } else { exit 1 }",
            ])
            .output();

        if let Ok(out) = com_check {
            if out.status.success() {
                excel_com = true;
            }
        }
    }

    let engine = if let Some(ref lp) = lo_path {
        ExcelEngine::LibreOffice(lp.clone())
    } else if excel_com {
        ExcelEngine::WindowsExcelCom
    } else {
        ExcelEngine::None
    };

    let info = SystemEngineInfo {
        word_com_available: false,
        libreoffice_available: lo_path.is_some(),
        libreoffice_path: lo_path.map(|p| p.to_string_lossy().to_string()),
    };

    (engine, info)
}

pub fn convert_excel_to_pdf(input_path: &str, output_path: &str) -> Result<ConversionResult, AppError> {
    let start = Instant::now();
    let in_file = Path::new(input_path);
    if !in_file.exists() {
        return Err(AppError::FileNotFound(input_path.to_string()));
    }

    let ext = in_file
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();
    if ext != "xlsx" && ext != "xls" && ext != "csv" {
        return Err(AppError::InvalidFileFormat {
            expected: ".xlsx, .xls, .csv".into(),
            actual: format!(".{}", ext),
        });
    }

    // Check 0-byte file early
    let in_meta = fs::metadata(in_file)?;
    if in_meta.len() == 0 {
        return Err(AppError::CorruptedFile("Berkas spreadsheet berukuran 0 byte".into()));
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

    let (engine, _) = detect_excel_engine();

    match engine {
        ExcelEngine::LibreOffice(soffice_path) => {
            let status = Command::new(soffice_path)
                .arg("--headless")
                .arg("--convert-to")
                .arg("pdf")
                .arg("--outdir")
                .arg(&clean_out_dir)
                .arg(&clean_in)
                .status()
                .map_err(|e| AppError::ExecutionError(format!("Gagal menjalankan LibreOffice: {}", e)))?;

            if !status.success() {
                return Err(AppError::ExecutionError("LibreOffice selesai dengan kode error".into()));
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
                .status()
                .map_err(|e| AppError::ExecutionError(format!("Gagal menjalankan Excel COM automation: {}", e)))?;

            if !status.success() {
                return Err(AppError::ExecutionError("Excel COM automation gagal mengonversi dokumen".into()));
            }
        }
        ExcelEngine::None => {
            return Err(AppError::EngineNotAvailable(
                "Tidak ditemukan LibreOffice maupun Microsoft Excel di komputer ini. Silakan pasang LibreOffice gratis untuk konversi Excel offline.".into()
            ));
        }
    }

    if !Path::new(&clean_out).exists() {
        return Err(AppError::ExecutionError("Proses konversi selesai tetapi berkas PDF tidak ditemukan di tujuan".into()));
    }

    let metadata = fs::metadata(&clean_out)?;
    let doc = lopdf::Document::load(&clean_out)?;
    let pages = doc.get_pages().len();

    Ok(ConversionResult {
        success: true,
        output_path: clean_out,
        duration_ms: start.elapsed().as_millis(),
        file_size_bytes: metadata.len(),
        total_pages: pages,
        ..Default::default()
    })
}

