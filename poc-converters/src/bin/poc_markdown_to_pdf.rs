use pulldown_cmark::{html, Options, Parser};
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

pub fn markdown_to_html(md: &str, theme: Option<&str>) -> String {
    let mut options = Options::empty();
    options.insert(Options::ENABLE_TABLES);
    options.insert(Options::ENABLE_FOOTNOTES);
    options.insert(Options::ENABLE_STRIKETHROUGH);
    options.insert(Options::ENABLE_TASKLISTS);
    options.insert(Options::ENABLE_HEADING_ATTRIBUTES);

    let parser = Parser::new_ext(md, options);
    let mut body = String::new();
    html::push_html(&mut body, parser);

    let css = match theme.unwrap_or("github") {
        "minimal" => r#"
            body { font-family: Georgia, serif; line-height: 1.8; color: #111; margin: 50px; font-size: 16px; }
            h1, h2, h3 { font-family: -apple-system, sans-serif; }
            pre, code { font-family: monospace; background: #eee; padding: 2px 4px; border-radius: 3px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border-bottom: 1px solid #ddd; padding: 8px; text-align: left; }
        "#,
        _ => r#"
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; line-height: 1.6; color: #24292f; margin: 40px; font-size: 14px; }
            h1, h2, h3, h4, h5, h6 { margin-top: 24px; margin-bottom: 16px; font-weight: 600; line-height: 1.25; }
            h1 { font-size: 2em; border-bottom: 1px solid #d0d7de; padding-bottom: .3em; color: #0969da; }
            h2 { font-size: 1.5em; border-bottom: 1px solid #d0d7de; padding-bottom: .3em; }
            code { padding: .2em .4em; margin: 0; font-size: 85%; background-color: #afb8c133; border-radius: 6px; font-family: monospace; }
            pre { padding: 16px; overflow: auto; font-size: 85%; line-height: 1.45; background-color: #f6f8fa; border-radius: 6px; }
            pre code { background-color: transparent; padding: 0; }
            blockquote { padding: 0 1em; color: #57606a; border-left: .25em solid #d0d7de; margin: 0 0 16px 0; }
            table { border-spacing: 0; border-collapse: collapse; margin: 16px 0; width: 100%; }
            table th, table td { padding: 6px 13px; border: 1px solid #d0d7de; }
            table tr:nth-child(2n) { background-color: #f6f8fa; }
            ul, ol { padding-left: 2em; margin: 16px 0; }
            hr { height: .25em; padding: 0; margin: 24px 0; background-color: #d0d7de; border: 0; }
        "#,
    };

    format!(
        r#"<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
{}
</style>
</head>
<body>
{}
</body>
</html>"#,
        css, body
    )
}

fn main() {
    println!("=== Testing Markdown to HTML & PDF ===");
    let sample_md = r#"# Dokumen Proyek Konverter

Ini adalah paragraf pengantar dengan format **tebal**, *miring*, dan `inline code`.

## Daftar Fitur
- [x] Merge PDF
- [x] Split PDF
- [x] Protect & Unlock PDF
- [ ] Markdown to PDF

## Contoh Kode
```rust
fn main() {
    println!("Hello from Markdown to PDF!");
}
```

## Tabel Evaluasi
| No | Modul | Status |
|:---|:---|:---|
| 1 | Parser | pulldown-cmark |
| 2 | Renderer | Headless Chromium |
"#;

    let html_content = markdown_to_html(sample_md, Some("github"));
    let temp_html = "poc-converters/output/poc_markdown.html";
    fs::write(temp_html, &html_content).expect("write temp html");
    println!("SUCCESS: Generated HTML at {}", temp_html);

    // Call Edge print-to-pdf
    let edge_path = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe";
    let out_pdf = Path::new("d:/Konverter/poc-converters/output/poc_markdown.pdf");
    let in_abs = fs::canonicalize(temp_html).unwrap();
    let in_str = in_abs.to_string_lossy().replace(r"\\?\", "");
    let file_url = format!("file:///{}", in_str.replace('\\', "/"));

    let status = Command::new(edge_path)
        .args([
            "--headless",
            "--disable-gpu",
            "--no-pdf-header-footer",
            "--run-all-compositor-stages-before-draw",
            &format!("--print-to-pdf={}", out_pdf.to_string_lossy()),
            &file_url,
        ])
        .status()
        .expect("run edge");

    assert!(status.success());
    assert!(out_pdf.exists());
    println!("SUCCESS: PDF created at {:?}", out_pdf);

    let doc = lopdf::Document::load(out_pdf).expect("load pdf");
    let text = doc.extract_text(&[1]).unwrap();
    println!("Page 1 text excerpt:\n{}", text.trim());
    assert!(text.contains("Dokumen Proyek Konverter"));
    assert!(text.contains("Daftar Fitur"));
    assert!(text.contains("Contoh Kode"));
    println!("ALL CHECKS PASSED!");
}
