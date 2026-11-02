use crate::converters::html_to_pdf;
use crate::errors::AppError;
use crate::models::ConversionResult;
use pulldown_cmark::{html, Options, Parser};
use std::fs;
use std::path::Path;

pub fn markdown_to_html_doc(md: &str, theme: Option<&str>) -> String {
    let mut options = Options::empty();
    options.insert(Options::ENABLE_TABLES);
    options.insert(Options::ENABLE_FOOTNOTES);
    options.insert(Options::ENABLE_STRIKETHROUGH);
    options.insert(Options::ENABLE_TASKLISTS);
    options.insert(Options::ENABLE_HEADING_ATTRIBUTES);

    let parser = Parser::new_ext(md, options);
    let mut body = String::new();
    html::push_html(&mut body, parser);

    let css = match theme.unwrap_or("github").to_lowercase().as_str() {
        "minimal" => r#"
            body { font-family: "Georgia", "Times New Roman", serif; line-height: 1.8; color: #111827; margin: 40px; font-size: 15px; }
            h1, h2, h3, h4, h5, h6 { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-weight: 700; color: #111; margin-top: 24px; margin-bottom: 12px; }
            h1 { font-size: 2.2em; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; }
            h2 { font-size: 1.6em; border-bottom: 1px solid #f3f4f6; padding-bottom: 6px; }
            code { font-family: ui-monospace, Menlo, Consolas, monospace; background: #f3f4f6; padding: 2px 5px; border-radius: 4px; font-size: 0.9em; }
            pre { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px; overflow: auto; line-height: 1.45; }
            pre code { background: transparent; padding: 0; }
            blockquote { border-left: 4px solid #cbd5e1; padding-left: 14px; color: #4b5563; margin: 16px 0; font-style: italic; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #e2e8f0; padding: 8px 12px; text-align: left; }
            th { background: #f1f5f9; font-weight: 600; }
            ul, ol { padding-left: 24px; margin: 12px 0; }
            li { margin: 4px 0; }
            hr { border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0; }
        "#,
        _ => r#"
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif; line-height: 1.6; color: #1f2328; margin: 40px; font-size: 14px; }
            h1, h2, h3, h4, h5, h6 { margin-top: 24px; margin-bottom: 16px; font-weight: 600; line-height: 1.25; color: #1f2328; }
            h1 { font-size: 2em; border-bottom: 1px solid #d8dee4; padding-bottom: .3em; color: #0969da; }
            h2 { font-size: 1.5em; border-bottom: 1px solid #d8dee4; padding-bottom: .3em; }
            h3 { font-size: 1.25em; }
            code { padding: .2em .4em; margin: 0; font-size: 85%; background-color: rgba(175, 184, 193, 0.2); border-radius: 6px; font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace; }
            pre { padding: 16px; overflow: auto; font-size: 85%; line-height: 1.45; background-color: #f6f8fa; border-radius: 6px; }
            pre code { background-color: transparent; padding: 0; }
            blockquote { padding: 0 1em; color: #656d76; border-left: .25em solid #d0d7de; margin: 16px 0; }
            table { border-spacing: 0; border-collapse: collapse; margin: 16px 0; width: 100%; }
            table th, table td { padding: 6px 13px; border: 1px solid #d0d7de; }
            table tr:nth-child(2n) { background-color: #f6f8fa; }
            table th { background-color: #f6f8fa; font-weight: 600; }
            ul, ol { padding-left: 2em; margin: 16px 0; }
            li { margin: 4px 0; }
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

pub fn convert_markdown_to_pdf(
    input_path: &str,
    output_path: &str,
    theme: Option<&str>,
    page_size: Option<&str>,
    margin: Option<&str>,
    orientation: Option<&str>,
) -> Result<ConversionResult, AppError> {
    let in_file = Path::new(input_path);
    if !in_file.exists() {
        return Err(AppError::FileNotFound(input_path.to_string()));
    }

    let ext = in_file
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();
    if ext != "md" && ext != "markdown" {
        return Err(AppError::InvalidFileFormat {
            expected: ".md atau .markdown".into(),
            actual: format!(".{}", ext),
        });
    }

    let in_meta = fs::metadata(in_file)?;
    if in_meta.len() == 0 {
        return Err(AppError::CorruptedFile("Berkas Markdown berukuran 0 byte".into()));
    }

    let md_content = fs::read_to_string(in_file).map_err(|e| {
        AppError::CorruptedFile(format!("Gagal membaca berkas Markdown: {}", e))
    })?;

    let html_doc = markdown_to_html_doc(&md_content, theme);

    let temp_dir = std::env::temp_dir().join(format!("md2pdf_{}", std::process::id()));
    fs::create_dir_all(&temp_dir)?;
    let temp_html_path = temp_dir.join("content.html");
    fs::write(&temp_html_path, html_doc.as_bytes())?;

    let result = html_to_pdf::convert_html_to_pdf(
        &temp_html_path.to_string_lossy(),
        output_path,
        page_size,
        margin,
        orientation,
    );

    let _ = fs::remove_dir_all(&temp_dir);

    result
}
