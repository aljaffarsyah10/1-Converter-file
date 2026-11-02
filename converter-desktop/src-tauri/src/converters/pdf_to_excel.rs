use crate::errors::AppError;
use crate::models::ConversionResult;
use lopdf::Document;
use rust_xlsxwriter::Workbook;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::Instant;

fn split_table_row(line: &str) -> Vec<String> {
    let line = line.trim();
    if line.is_empty() {
        return Vec::new();
    }

    // 1. If tab-separated
    if line.contains('\t') {
        return line
            .split('\t')
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
            .collect();
    }

    // 2. If pipe-separated (e.g. Markdown table: | col1 | col2 |)
    if line.contains('|') {
        let cols: Vec<String> = line
            .split('|')
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
            .collect();
        if cols.len() > 1 {
            return cols;
        }
    }

    // 3. If multiple spaces separated (2 or more spaces)
    let parts: Vec<String> = line
        .split("  ")
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .collect();

    if parts.len() > 1 {
        return parts;
    }

    // 4. Fallback: single column
    vec![line.to_string()]
}

pub fn convert_pdf_to_excel(input_path: &str, output_path: &str) -> Result<ConversionResult, AppError> {
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
    let doc = Document::load(in_file).map_err(|e| {
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

    let mut workbook = Workbook::new();
    let total_pages = pages.len();

    let mut sorted_page_nums: Vec<u32> = pages.keys().copied().collect();
    sorted_page_nums.sort();

    for &page_num in &sorted_page_nums {
        let sheet_name = if total_pages == 1 {
            "Sheet 1".to_string()
        } else {
            format!("Halaman {}", page_num)
        };

        let worksheet = workbook
            .add_worksheet()
            .set_name(&sheet_name)
            .map_err(|e| AppError::ExecutionError(format!("Gagal membuat worksheet: {}", e)))?;

        let text = doc.extract_text(&[page_num]).unwrap_or_default();
        let mut row_idx: u32 = 0;

        for line in text.lines() {
            let cols = split_table_row(line);
            if cols.is_empty() {
                continue;
            }

            for (col_idx, val) in cols.iter().enumerate() {
                // Try parse integer
                if let Ok(num) = val.replace(',', "").parse::<i64>() {
                    let _ = worksheet.write_number(row_idx, col_idx as u16, num as f64);
                } else if let Ok(num) = val.replace(',', ".").parse::<f64>() {
                    let _ = worksheet.write_number(row_idx, col_idx as u16, num);
                } else {
                    let _ = worksheet.write_string(row_idx, col_idx as u16, val);
                }
            }

            row_idx += 1;
        }

        // If page has no text, write a placeholder
        if row_idx == 0 {
            let _ = worksheet.write_string(
                0,
                0,
                format!("(Halaman {} kosong / berupa gambar)", page_num),
            );
        }
    }

    workbook
        .save(&out_file)
        .map_err(|e| AppError::IoError(format!("Gagal menyimpan berkas XLSX: {}", e)))?;

    let out_metadata = fs::metadata(&out_file)?;

    Ok(ConversionResult {
        success: true,
        output_path: out_file.to_string_lossy().to_string(),
        duration_ms: start.elapsed().as_millis(),
        file_size_bytes: out_metadata.len(),
        total_pages,
        ..Default::default()
    })
}

