use crate::converters::pdf_split::parse_page_range;
use crate::errors::AppError;
use crate::models::ConversionResult;
use lopdf::{Document, Object};
use std::collections::HashSet;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::Instant;

pub fn rotate_pdf_pages(
    input_path: &str,
    output_path: &str,
    angle: i64,
    page_range: Option<&str>,
) -> Result<ConversionResult, AppError> {
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
    let mut doc = Document::load(in_file).map_err(|e| {
        AppError::CorruptedFile(format!("Gagal membaca berkas PDF: {}", e))
    })?;

    let pages = doc.get_pages();
    if pages.is_empty() {
        return Err(AppError::CorruptedFile(
            "Dokumen PDF tidak memiliki halaman yang valid".into(),
        ));
    }
    let total_pages = pages.len();

    // Determine target pages to rotate
    let filter_set: Option<HashSet<u32>> = match page_range {
        Some(range_str) if !range_str.trim().is_empty() => {
            let target_pages = parse_page_range(range_str, total_pages)?;
            Some(target_pages.into_iter().collect())
        }
        _ => None,
    };

    // Rotate pages
    for (&page_num, &page_id) in pages.iter() {
        if let Some(ref set) = filter_set {
            if !set.contains(&page_num) {
                continue;
            }
        }

        let page_obj = doc.get_object_mut(page_id).map_err(|e| {
            AppError::CorruptedFile(format!("Gagal mengambil objek halaman {}: {}", page_num, e))
        })?;

        let page_dict = page_obj.as_dict_mut().map_err(|e| {
            AppError::CorruptedFile(format!("Kamus halaman {} tidak valid: {}", page_num, e))
        })?;

        let current_rot = page_dict
            .get(b"Rotate")
            .and_then(|obj| obj.as_i64())
            .unwrap_or(0);

        let new_rot = (current_rot + angle).rem_euclid(360);
        page_dict.set("Rotate", Object::Integer(new_rot));
    }

    // Prepare output directory
    let out_file = PathBuf::from(output_path);
    let out_dir = out_file.parent().unwrap_or(Path::new("."));
    if !out_dir.exists() {
        fs::create_dir_all(out_dir)?;
    }

    doc.save(&out_file)
        .map_err(|e| AppError::IoError(format!("Gagal menyimpan PDF: {}", e)))?;

    let out_meta = fs::metadata(&out_file)?;

    Ok(ConversionResult {
        success: true,
        output_path: out_file.to_string_lossy().to_string(),
        duration_ms: start.elapsed().as_millis(),
        file_size_bytes: out_meta.len(),
        total_pages,
        ..Default::default()
    })
}

