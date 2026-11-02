use crate::errors::AppError;
use crate::models::ConversionResult;
use lopdf::{Document, Object};
use std::fs;
use std::io::Cursor;
use std::path::{Path, PathBuf};
use std::time::Instant;

pub fn compress_pdf_file(
    input_path: &str,
    output_path: &str,
    level: Option<&str>,
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
    let original_size = in_meta.len();
    if original_size == 0 {
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

    // 1. Prune unused objects
    doc.prune_objects();

    // 2. Compress streams with Flate
    doc.compress();

    // 3. Image re-encoding parameters based on compression level
    let lvl = level.unwrap_or("medium").to_lowercase();
    let (jpeg_quality, max_dim): (u8, u32) = match lvl.as_str() {
        "low" => (80, 2400),
        "high" => (40, 1000),
        _ => (60, 1600), // "medium"
    };

    // Re-encode embedded image streams
    for (_id, object) in doc.objects.iter_mut() {
        if let Object::Stream(stream) = object {
            let is_image = stream.dict.get(b"Subtype").map_or(false, |val| {
                val.as_name().map_or(false, |name| name == b"Image")
            });

            if is_image {
                if let Ok(decompressed) = stream.decompressed_content() {
                    if let Ok(mut dyn_img) = image::load_from_memory(&decompressed) {
                        let (w, h) = (dyn_img.width(), dyn_img.height());
                        if w > max_dim || h > max_dim {
                            let ratio = (max_dim as f32) / (w.max(h) as f32);
                            let new_w = ((w as f32) * ratio) as u32;
                            let new_h = ((h as f32) * ratio) as u32;
                            dyn_img = dyn_img.resize(new_w, new_h, image::imageops::FilterType::Lanczos3);
                        }

                        let mut compressed_buf = Cursor::new(Vec::new());
                        let mut encoder =
                            image::codecs::jpeg::JpegEncoder::new_with_quality(&mut compressed_buf, jpeg_quality);
                        if encoder.encode_image(&dyn_img).is_ok() {
                            let new_bytes = compressed_buf.into_inner();
                            if new_bytes.len() < stream.content.len() {
                                stream.set_content(new_bytes);
                                stream.dict.set("Filter", Object::Name(b"DCTDecode".to_vec()));
                                stream.dict.set("Width", Object::Integer(dyn_img.width() as i64));
                                stream.dict.set("Height", Object::Integer(dyn_img.height() as i64));
                            }
                        }
                    }
                }
            }
        }
    }

    // Ensure output directory exists
    let out_file = PathBuf::from(output_path);
    let out_dir = out_file.parent().unwrap_or(Path::new("."));
    if !out_dir.exists() {
        fs::create_dir_all(out_dir)?;
    }

    doc.save(&out_file)
        .map_err(|e| AppError::IoError(format!("Gagal menyimpan PDF terkompresi: {}", e)))?;

    let compressed_size = fs::metadata(&out_file)?.len();
    let reduction_percent = if original_size > 0 && original_size > compressed_size {
        ((original_size as f64 - compressed_size as f64) / original_size as f64) * 100.0
    } else {
        0.0
    };

    Ok(ConversionResult {
        success: true,
        output_path: out_file.to_string_lossy().to_string(),
        duration_ms: start.elapsed().as_millis(),
        file_size_bytes: compressed_size,
        total_pages,
        original_size_bytes: Some(original_size),
        compressed_size_bytes: Some(compressed_size),
        reduction_percent: Some(reduction_percent),
    })
}
