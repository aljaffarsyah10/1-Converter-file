use crate::errors::AppError;
use crate::models::ConversionResult;
use docx_rs::*;
use std::fs::{self, File};
use std::path::{Path, PathBuf};
use std::time::Instant;

pub fn convert_pdf_to_docx(input_path: &str, output_path: &str) -> Result<ConversionResult, AppError> {
    let start = Instant::now();
    let in_file = Path::new(input_path);
    if !in_file.exists() {
        return Err(AppError::FileNotFound(input_path.to_string()));
    }

    // Validate extension
    let ext = in_file
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();
    if ext != "pdf" {
        return Err(AppError::InvalidFileFormat {
            expected: ".pdf".into(),
            actual: format!(".{}", ext),
        });
    }

    // Check 0-byte file early
    let in_meta = fs::metadata(in_file)?;
    if in_meta.len() == 0 {
        return Err(AppError::CorruptedFile("Berkas PDF berukuran 0 byte".into()));
    }

    // Load PDF document using lopdf
    let doc = lopdf::Document::load(in_file).map_err(|e| {
        AppError::CorruptedFile(format!("Gagal membaca berkas PDF: {}", e))
    })?;

    let pages = doc.get_pages();
    if pages.is_empty() {
        return Err(AppError::CorruptedFile(
            "Dokumen PDF tidak memiliki halaman yang valid".into(),
        ));
    }

    // Prepare output directory
    let out_file = PathBuf::from(output_path);
    let out_dir = out_file.parent().unwrap_or(Path::new("."));
    if !out_dir.exists() {
        fs::create_dir_all(out_dir)?;
    }

    let mut docx = Docx::new();

    let mut page_indices: Vec<u32> = pages.keys().copied().collect();
    page_indices.sort();

    let total_pages = page_indices.len();

    for (idx, &page_num) in page_indices.iter().enumerate() {
        if idx > 0 {
            // Insert page break before subsequent pages
            docx = docx.add_paragraph(
                Paragraph::new().add_run(Run::new().add_break(BreakType::Page)),
            );
        }

        match doc.extract_text(&[page_num]) {
            Ok(text) => {
                let trimmed_all = text.trim();
                if trimmed_all.is_empty() {
                    // Empty or scanned page
                    docx = docx.add_paragraph(
                        Paragraph::new()
                            .add_run(Run::new().add_text(format!("(Halaman {})", page_num))),
                    );
                } else {
                    for line in text.lines() {
                        let trimmed = line.trim();
                        if !trimmed.is_empty() {
                            docx = docx.add_paragraph(
                                Paragraph::new().add_run(Run::new().add_text(trimmed)),
                            );
                        }
                    }
                }
            }
            Err(_) => {
                docx = docx.add_paragraph(
                    Paragraph::new()
                        .add_run(Run::new().add_text(format!("(Halaman {})", page_num))),
                );
            }
        }
    }

    let file = File::create(&out_file)
        .map_err(|e| AppError::IoError(format!("Gagal membuat berkas DOCX: {}", e)))?;

    docx.build()
        .pack(file)
        .map_err(|e| AppError::ExecutionError(format!("Gagal mengemas berkas DOCX: {}", e)))?;

    let out_metadata = fs::metadata(&out_file)?;

    Ok(ConversionResult {
        success: true,
        output_path: out_file.to_string_lossy().to_string(),
        duration_ms: start.elapsed().as_millis(),
        file_size_bytes: out_metadata.len(),
        total_pages,
    })
}
