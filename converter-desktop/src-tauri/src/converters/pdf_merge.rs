use crate::errors::AppError;
use crate::models::ConversionResult;
use lopdf::{dictionary, Document, Object};
use std::collections::BTreeMap;
use std::fs;
use std::path::Path;
use std::time::Instant;

pub fn merge_pdf_files(input_paths: &[String], output_path: &str) -> Result<ConversionResult, AppError> {
    let start = Instant::now();

    if input_paths.is_empty() {
        return Err(AppError::ExecutionError("Daftar berkas input tidak boleh kosong".into()));
    }

    let mut max_id = 1;
    let mut all_pages = Vec::new();
    let mut all_objects = BTreeMap::new();

    for input in input_paths {
        let path = Path::new(input);
        if !path.exists() {
            return Err(AppError::FileNotFound(input.to_string()));
        }

        let mut doc = Document::load(path)?;
        doc.renumber_objects_with(max_id);
        max_id = doc.max_id + 1;

        for (page_num, page_id) in doc.get_pages() {
            all_pages.push((page_num, page_id));
        }

        for (id, object) in doc.objects {
            let is_special = match &object {
                Object::Dictionary(dict) => {
                    dict.get(b"Type").and_then(|o| o.as_name()).map(|n| n == b"Catalog" || n == b"Pages" || n == b"XRef").unwrap_or(false)
                }
                Object::Stream(stream) => {
                    stream.dict.get(b"Type").and_then(|o| o.as_name()).map(|n| n == b"Catalog" || n == b"Pages" || n == b"XRef").unwrap_or(false)
                }
                _ => false,
            };

            if is_special {
                continue;
            }
            all_objects.insert(id, object);
        }
    }

    let page_count = all_pages.len();
    if page_count == 0 {
        return Err(AppError::CorruptedFile("Tidak ditemukan halaman valid pada berkas input".into()));
    }

    let mut merged_doc = Document::with_version("1.5");
    merged_doc.objects = all_objects;
    merged_doc.max_id = merged_doc.objects.keys().map(|(id, _)| *id).max().unwrap_or(0);

    // Create new Pages dictionary
    let pages_id = merged_doc.new_object_id();
    let kids: Vec<Object> = all_pages.iter().map(|(_, id)| Object::Reference(*id)).collect();

    let pages_dict = dictionary! {
        "Type" => Object::Name(b"Pages".to_vec()),
        "Count" => Object::Integer(page_count as i64),
        "Kids" => Object::Array(kids),
    };
    merged_doc.objects.insert(pages_id, Object::Dictionary(pages_dict));

    // Update parent reference on each page
    for (_, page_id) in &all_pages {
        if let Ok(page_obj) = merged_doc.get_object_mut(*page_id) {
            if let Ok(dict) = page_obj.as_dict_mut() {
                dict.set("Parent", Object::Reference(pages_id));
            }
        }
    }

    // Create Catalog dictionary
    let catalog_id = merged_doc.new_object_id();
    let catalog_dict = dictionary! {
        "Type" => Object::Name(b"Catalog".to_vec()),
        "Pages" => Object::Reference(pages_id),
    };
    merged_doc.objects.insert(catalog_id, Object::Dictionary(catalog_dict));

    // Set clean trailer Root
    merged_doc.trailer = dictionary! {
        "Root" => Object::Reference(catalog_id),
    };
    merged_doc.prune_objects();

    // Ensure parent directory exists
    if let Some(parent) = Path::new(output_path).parent() {
        if !parent.exists() {
            fs::create_dir_all(parent)?;
        }
    }

    merged_doc.save(output_path)?;

    let metadata = fs::metadata(output_path)?;
    Ok(ConversionResult {
        success: true,
        output_path: output_path.to_string(),
        duration_ms: start.elapsed().as_millis(),
        file_size_bytes: metadata.len(),
        total_pages: page_count,
        ..Default::default()
    })
}

