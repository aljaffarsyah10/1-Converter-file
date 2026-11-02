use crate::errors::AppError;
use crate::models::ConversionResult;
use lopdf::Document;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::time::Instant;

pub fn find_chromium_browser() -> Option<PathBuf> {
    let candidate_paths = [
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    ];

    for path in candidate_paths {
        let p = Path::new(path);
        if p.exists() {
            return Some(p.to_path_buf());
        }
    }

    for cmd in ["msedge.exe", "msedge", "chrome.exe", "chrome"] {
        if let Ok(output) = Command::new("where.exe").arg(cmd).output() {
            if output.status.success() {
                let stdout = String::from_utf8_lossy(&output.stdout);
                if let Some(first_line) = stdout.lines().next() {
                    let p = PathBuf::from(first_line.trim());
                    if p.exists() {
                        return Some(p);
                    }
                }
            }
        }
    }

    None
}

pub fn find_libreoffice() -> Option<PathBuf> {
    let lo_candidates = [
        PathBuf::from("C:\\Program Files\\LibreOffice\\program\\soffice.exe"),
        PathBuf::from("C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe"),
    ];

    for path in &lo_candidates {
        if path.exists() {
            return Some(path.clone());
        }
    }

    if let Ok(output) = Command::new("where.exe").arg("soffice").output() {
        if output.status.success() {
            let s = String::from_utf8_lossy(&output.stdout).trim().to_string();
            if !s.is_empty() {
                let p = PathBuf::from(s);
                if p.exists() {
                    return Some(p);
                }
            }
        }
    }

    None
}

pub fn convert_html_to_pdf(
    input_path: &str,
    output_path: &str,
    page_size: Option<&str>,
    margin: Option<&str>,
    orientation: Option<&str>,
) -> Result<ConversionResult, AppError> {
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
    if ext != "html" && ext != "htm" {
        return Err(AppError::InvalidFileFormat {
            expected: ".html atau .htm".into(),
            actual: format!(".{}", ext),
        });
    }

    let in_meta = fs::metadata(in_file)?;
    if in_meta.len() == 0 {
        return Err(AppError::CorruptedFile("Berkas HTML berukuran 0 byte".into()));
    }

    let html_content = fs::read_to_string(in_file).map_err(|e| {
        AppError::CorruptedFile(format!("Gagal membaca berkas HTML: {}", e))
    })?;

    // Determine page size, orientation, and margin
    let sz = match page_size.unwrap_or("a4").to_lowercase().as_str() {
        "letter" => "letter",
        _ => "A4",
    };
    let ori = match orientation.unwrap_or("portrait").to_lowercase().as_str() {
        "landscape" => "landscape",
        _ => "portrait",
    };
    let m = match margin.unwrap_or("normal").to_lowercase().as_str() {
        "none" => "0mm",
        "small" => "8mm",
        _ => "15mm",
    };

    let style_inject = format!(
        "\n<style>\n@page {{ size: {} {}; margin: {}; }}\n</style>\n",
        sz, ori, m
    );

    let final_html = if html_content.to_lowercase().contains("<head>") {
        html_content.replacen("<head>", &format!("<head>{}", style_inject), 1)
    } else {
        format!("{}{}", style_inject, html_content)
    };

    // Prepare temp file
    let temp_dir = std::env::temp_dir().join(format!("html2pdf_{}", std::process::id()));
    fs::create_dir_all(&temp_dir)?;
    let temp_html_path = temp_dir.join("render.html");
    fs::write(&temp_html_path, final_html.as_bytes())?;

    // Prepare absolute output path
    let out_abs = if Path::new(output_path).is_absolute() {
        PathBuf::from(output_path)
    } else {
        std::env::current_dir()?.join(output_path)
    };
    if let Some(parent) = out_abs.parent() {
        fs::create_dir_all(parent)?;
    }

    let chromium_browser = find_chromium_browser();
    let lo_browser = if chromium_browser.is_none() { find_libreoffice() } else { None };

    let _engine_used = if chromium_browser.is_some() {
        "Chromium (Edge/Chrome)"
    } else {
        "LibreOffice"
    };

    if let Some(ref browser_path) = chromium_browser {
        let temp_canonical = fs::canonicalize(&temp_html_path)?;
        let temp_str = temp_canonical.to_string_lossy().replace(r"\\?\", "");
        let file_url = format!("file:///{}", temp_str.replace('\\', "/"));
        let out_str = out_abs.to_string_lossy().to_string();

        let args = [
            "--headless",
            "--disable-gpu",
            "--no-pdf-header-footer",
            "--run-all-compositor-stages-before-draw",
            &format!("--print-to-pdf={}", out_str),
            &file_url,
        ];

        let output = Command::new(browser_path)
            .args(&args)
            .output()
            .map_err(|e| AppError::ExecutionError(format!("Gagal menjalankan Chromium: {}", e)))?;

        if !out_abs.exists() {
            let _ = fs::remove_dir_all(&temp_dir);
            return Err(AppError::ExecutionError(format!(
                "Chromium print-to-pdf gagal. Stderr: {}",
                String::from_utf8_lossy(&output.stderr)
            )));
        }
    } else if let Some(ref lo_path) = lo_browser {
        let out_parent = out_abs.parent().unwrap_or(Path::new("."));
        let status = Command::new(lo_path)
            .args([
                "--headless",
                "--convert-to",
                "pdf:writer_pdf_Export",
                "--outdir",
                &out_parent.to_string_lossy(),
                &temp_html_path.to_string_lossy(),
            ])
            .status()
            .map_err(|e| AppError::ExecutionError(format!("Gagal menjalankan LibreOffice: {}", e)))?;

        let lo_generated = out_parent.join("render.pdf");
        if lo_generated.exists() {
            if lo_generated != out_abs {
                let _ = fs::rename(&lo_generated, &out_abs);
            }
        } else if !out_abs.exists() {
            let _ = fs::remove_dir_all(&temp_dir);
            return Err(AppError::ExecutionError(format!(
                "LibreOffice gagal mengonversi HTML ke PDF. Status exit: {:?}",
                status.code()
            )));
        }
    } else {
        let _ = fs::remove_dir_all(&temp_dir);
        return Err(AppError::EngineNotAvailable(
            "Engine rendering HTML ke PDF tidak ditemukan (Microsoft Edge, Google Chrome, atau LibreOffice diperlukan)".into(),
        ));
    }

    let _ = fs::remove_dir_all(&temp_dir);

    let out_meta = fs::metadata(&out_abs)?;
    let total_pages = Document::load(&out_abs)
        .map(|doc| doc.get_pages().len())
        .unwrap_or(1);

    Ok(ConversionResult {
        success: true,
        output_path: out_abs.to_string_lossy().to_string(),
        duration_ms: start.elapsed().as_millis(),
        file_size_bytes: out_meta.len(),
        total_pages,
        ..Default::default()
    })
}
