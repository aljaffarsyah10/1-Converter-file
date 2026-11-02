use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::time::Instant;

#[derive(Debug, PartialEq)]
pub enum PptxEngine {
    LibreOffice(PathBuf),
    WindowsPowerPointCom,
    None,
}

pub fn detect_pptx_engine() -> PptxEngine {
    // 1. Check LibreOffice
    let lo_candidates = [
        PathBuf::from("C:\\Program Files\\LibreOffice\\program\\soffice.exe"),
        PathBuf::from("C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe"),
    ];

    for path in &lo_candidates {
        if path.exists() {
            return PptxEngine::LibreOffice(path.clone());
        }
    }

    if let Ok(output) = Command::new("where.exe").arg("soffice").output() {
        if output.status.success() {
            let s = String::from_utf8_lossy(&output.stdout).trim().to_string();
            if !s.is_empty() {
                return PptxEngine::LibreOffice(PathBuf::from(s));
            }
        }
    }

    // 2. Check Windows PowerPoint COM
    let ppt_exe = PathBuf::from("C:\\Program Files\\Microsoft Office\\root\\Office16\\POWERPNT.EXE");
    if ppt_exe.exists() {
        return PptxEngine::WindowsPowerPointCom;
    }

    let com_check = Command::new("powershell")
        .args([
            "-NoProfile",
            "-Command",
            "$p = New-Object -ComObject PowerPoint.Application -ErrorAction SilentlyContinue; if ($p) { $p.Quit(); exit 0 } else { exit 1 }",
        ])
        .output();

    if let Ok(out) = com_check {
        if out.status.success() {
            return PptxEngine::WindowsPowerPointCom;
        }
    }

    PptxEngine::None
}

pub fn convert_pptx_to_pdf(input_path: &str, output_path: &str) -> Result<(u128, u64, usize), Box<dyn std::error::Error>> {
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
    if ext != "pptx" && ext != "ppt" {
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

    let engine = detect_pptx_engine();

    match engine {
        PptxEngine::LibreOffice(soffice_path) => {
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
        PptxEngine::WindowsPowerPointCom => {
            let script = format!(
                "$ppt = New-Object -ComObject PowerPoint.Application; \
                 try {{ \
                     $pres = $ppt.Presentations.Open('{clean_in}', -1, 0, 0); \
                     $pres.SaveAs('{clean_out}', 32); \
                     $pres.Close(); \
                 }} finally {{ \
                     $ppt.Quit(); \
                     [System.Runtime.InteropServices.Marshal]::ReleaseComObject($ppt) | Out-Null; \
                 }}",
                clean_in = clean_in.replace('\\', "\\\\"),
                clean_out = clean_out.replace('\\', "\\\\"),
            );

            let status = Command::new("powershell")
                .args(["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", &script])
                .status()?;

            if !status.success() {
                return Err("PowerPoint COM automation failed".into());
            }
        }
        PptxEngine::None => {
            return Err("Neither LibreOffice nor Microsoft PowerPoint is available on this system".into());
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
    println!("=== Testing PoC PPTX to PDF ===");

    let detected = detect_pptx_engine();
    println!("Detected Engine: {:?}", detected);

    let sample_pptx = if Path::new("poc-converters/fixtures/sample.pptx").exists() {
        "poc-converters/fixtures/sample.pptx"
    } else {
        "fixtures/sample.pptx"
    };
    let out_pdf = if Path::new("poc-converters").exists() {
        "poc-converters/output/poc_pptx_converted.pdf"
    } else {
        "output/poc_pptx_converted.pdf"
    };

    if Path::new(sample_pptx).exists() {
        match convert_pptx_to_pdf(sample_pptx, out_pdf) {
            Ok((ms, size, pages)) => {
                println!("PPTX -> PDF SUCCESS: {} ms, {} bytes, {} pages", ms, size, pages);
            }
            Err(e) => println!("PPTX -> PDF FAILED: {}", e),
        }
    } else {
        println!("sample.pptx not found");
    }
}
