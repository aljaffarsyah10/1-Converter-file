use lopdf::Document;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

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

    // Check PATH
    for cmd in ["msedge.exe", "msedge", "chrome.exe", "chrome"] {
        if let Ok(output) = Command::new("where").arg(cmd).output() {
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

pub fn convert_html_to_pdf(
    input_path: &str,
    output_path: &str,
    landscape: bool,
    no_header_footer: bool,
) -> Result<(), Box<dyn std::error::Error>> {
    let browser_path = find_chromium_browser()
        .ok_or_else(|| "Tidak dapat menemukan Microsoft Edge atau Google Chrome untuk merender HTML")?;

    let in_abs = fs::canonicalize(input_path)?;
    let in_str = in_abs.to_string_lossy().replace(r"\\?\", "");
    let file_url = format!("file:///{}", in_str.replace('\\', "/"));

    let out_abs = if Path::new(output_path).is_absolute() {
        PathBuf::from(output_path)
    } else {
        std::env::current_dir()?.join(output_path)
    };
    if let Some(parent) = out_abs.parent() {
        fs::create_dir_all(parent)?;
    }
    let out_str = out_abs.to_string_lossy().to_string();

    let mut args = vec![
        "--headless".to_string(),
        "--disable-gpu".to_string(),
        "--run-all-compositor-stages-before-draw".to_string(),
        format!("--print-to-pdf={}", out_str),
    ];

    if no_header_footer {
        args.push("--no-pdf-header-footer".to_string());
    }

    if landscape {
        // Chromium supports --print-to-pdf options or landscape in CSS @page
        // Or via argument in newer versions
    }

    args.push(file_url);

    println!("Executing: {:?} {:?}", browser_path, args);

    let output = Command::new(&browser_path)
        .args(&args)
        .output()?;

    if !out_abs.exists() {
        return Err(format!(
            "Konversi gagal. Stderr: {}",
            String::from_utf8_lossy(&output.stderr)
        ).into());
    }

    Ok(())
}

fn main() {
    println!("=== Testing HTML to PDF Converter ===");
    let browser = find_chromium_browser();
    println!("Found browser: {:?}", browser);

    let input_html = "poc-converters/fixtures/sample.html";
    let output_pdf = "poc-converters/output/poc_sample_html.pdf";

    convert_html_to_pdf(input_html, output_pdf, false, true).expect("convert HTML to PDF");
    println!("SUCCESS: Created {}", output_pdf);

    // Verify PDF is valid lopdf document
    let doc = Document::load(output_pdf).expect("load output PDF with lopdf");
    let pages = doc.get_pages();
    println!("VERIFIED: PDF is valid and has {} page(s)", pages.len());
    let text = doc.extract_text(&[1]).unwrap();
    println!("Page 1 text excerpt:\n{}", text.trim());
    assert!(text.contains("Laporan Konversi Dokumen"));
    assert!(text.contains("HTML to PDF"));
    println!("ALL CHECKS PASSED!");
}
