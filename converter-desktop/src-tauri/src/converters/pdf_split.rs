use crate::errors::AppError;
use crate::models::ConversionResult;
use lopdf::{dictionary, Document, Object};
use std::fs;
use std::path::{Path, PathBuf};
use std::time::Instant;

/// Parse range string like "1-3, 5, 8-10" into sorted unique 1-based page indices
pub fn parse_page_range(range_str: &str, max_pages: usize) -> Result<Vec<u32>, AppError> {
    let mut pages = Vec::new();
    let parts = range_str.split(',');

    for part in parts {
        let trimmed = part.trim();
        if trimmed.is_empty() {
            continue;
        }

        if trimmed.contains('-') {
            let bounds: Vec<&str> = trimmed.split('-').map(|s| s.trim()).collect();
            if bounds.len() != 2 {
                return Err(AppError::InvalidPageRange(format!("Sintaks rentang tidak valid: {}", trimmed)));
            }
            let start = bounds[0].parse::<usize>().map_err(|_| {
                AppError::InvalidPageRange(format!("Angka tidak valid: {}", bounds[0]))
            })?;
            let end = bounds[1].parse::<usize>().map_err(|_| {
                AppError::InvalidPageRange(format!("Angka tidak valid: {}", bounds[1]))
            })?;

            if start == 0 || end == 0 || start > end {
                return Err(AppError::InvalidPageRange(format!("Rentang tidak logis: {}-{}", start, end)));
            }

            for p in start..=end {
                if p > max_pages {
                    return Err(AppError::InvalidPageRange(format!("Halaman {} melebihi total halaman ({})", p, max_pages)));
                }
                pages.push(p as u32);
            }
        } else {
            let p = trimmed.parse::<usize>().map_err(|_| {
                AppError::InvalidPageRange(format!("Angka tidak valid: {}", trimmed))
            })?;
            if p == 0 || p > max_pages {
                return Err(AppError::InvalidPageRange(format!("Halaman {} melebihi total halaman ({})", p, max_pages)));
            }
            pages.push(p as u32);
        }
    }

    pages.sort_unstable();
    pages.dedup();

    if pages.is_empty() {
        return Err(AppError::InvalidPageRange("Tidak ada halaman yang ditentukan".into()));
    }

    Ok(pages)
}

pub fn split_pdf_file(
    input_path: &str,
    output_dir: &str,
    output_prefix: &str,
    mode: &str,
    page_range: Option<&str>,
) -> Result<ConversionResult, AppError> {
    let start = Instant::now();
    let in_file = Path::new(input_path);
    if !in_file.exists() {
        return Err(AppError::FileNotFound(input_path.to_string()));
    }

    let out_dir = Path::new(output_dir);
    if !out_dir.exists() {
        fs::create_dir_all(out_dir)?;
    }

    let original = Document::load(in_file)?;
    let all_pages = original.get_pages();
    let total_pages = all_pages.len();

    if total_pages == 0 {
        return Err(AppError::CorruptedFile("Dokumen PDF tidak memuat halaman".into()));
    }

    let target_pages: Vec<u32> = if mode == "split_all" {
        (1..=(total_pages as u32)).collect()
    } else {
        let range = page_range.unwrap_or("1");
        parse_page_range(range, total_pages)?
    };

    // If single range extraction, we save all target pages into one extracted PDF
    // If split_all, save per page
    let is_split_all = mode == "split_all";
    let mut total_output_size = 0u64;
    let mut primary_output = String::new();

    if !is_split_all {
        // Extract specified pages into one combined result
        let target_page_ids: Vec<_> = target_pages.iter().filter_map(|p| all_pages.get(p).copied()).collect();
        let mut new_doc = Document::with_version(original.version.as_str());
        new_doc.objects = original.objects.clone();
        new_doc.max_id = new_doc.objects.keys().map(|(id, _)| *id).max().unwrap_or(0);

        let pages_id = new_doc.new_object_id();
        let kids: Vec<Object> = target_page_ids.iter().map(|&id| Object::Reference(id)).collect();

        let pages_dict = dictionary! {
            "Type" => Object::Name(b"Pages".to_vec()),
            "Count" => Object::Integer(target_page_ids.len() as i64),
            "Kids" => Object::Array(kids),
        };
        new_doc.objects.insert(pages_id, Object::Dictionary(pages_dict));

        for &page_id in &target_page_ids {
            if let Ok(page_obj) = new_doc.get_object_mut(page_id) {
                if let Ok(dict) = page_obj.as_dict_mut() {
                    dict.set("Parent", Object::Reference(pages_id));
                }
            }
        }

        let catalog_id = new_doc.new_object_id();
        let catalog_dict = dictionary! {
            "Type" => Object::Name(b"Catalog".to_vec()),
            "Pages" => Object::Reference(pages_id),
        };
        new_doc.objects.insert(catalog_id, Object::Dictionary(catalog_dict));

        new_doc.trailer = dictionary! {
            "Root" => Object::Reference(catalog_id),
        };
        new_doc.prune_objects();

        let out_path = out_dir.join(format!("{}.pdf", output_prefix));
        new_doc.save(&out_path)?;
        total_output_size = fs::metadata(&out_path)?.len();
        primary_output = out_path.to_string_lossy().to_string();
    } else {
        // Split each page into separate files
        for p in &target_pages {
            let page_id = *all_pages.get(p).unwrap();
            let mut new_doc = Document::with_version(original.version.as_str());
            new_doc.objects = original.objects.clone();
            new_doc.max_id = new_doc.objects.keys().map(|(id, _)| *id).max().unwrap_or(0);

            let pages_id = new_doc.new_object_id();
            let pages_dict = dictionary! {
                "Type" => Object::Name(b"Pages".to_vec()),
                "Count" => Object::Integer(1),
                "Kids" => Object::Array(vec![Object::Reference(page_id)]),
            };
            new_doc.objects.insert(pages_id, Object::Dictionary(pages_dict));

            if let Ok(page_obj) = new_doc.get_object_mut(page_id) {
                if let Ok(dict) = page_obj.as_dict_mut() {
                    dict.set("Parent", Object::Reference(pages_id));
                }
            }

            let catalog_id = new_doc.new_object_id();
            let catalog_dict = dictionary! {
                "Type" => Object::Name(b"Catalog".to_vec()),
                "Pages" => Object::Reference(pages_id),
            };
            new_doc.objects.insert(catalog_id, Object::Dictionary(catalog_dict));

            new_doc.trailer = dictionary! {
                "Root" => Object::Reference(catalog_id),
            };
            new_doc.prune_objects();

            let out_path = out_dir.join(format!("{}_page_{}.pdf", output_prefix, p));
            new_doc.save(&out_path)?;
            total_output_size += fs::metadata(&out_path)?.len();
            if primary_output.is_empty() {
                primary_output = out_path.to_string_lossy().to_string();
            }
        }
    }

    Ok(ConversionResult {
        success: true,
        output_path: primary_output,
        duration_ms: start.elapsed().as_millis(),
        file_size_bytes: total_output_size,
        total_pages: target_pages.len(),
    })
}

