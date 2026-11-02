use crate::errors::AppError;
use crate::models::ConversionResult;
use image::codecs::jpeg::JpegEncoder;
use image::codecs::png::{CompressionType, FilterType, PngEncoder};
use image::ImageFormat;
use std::fs::{self, File};
use std::io::BufWriter;
use std::path::Path;
use std::time::Instant;

pub fn compress_image_file(
    input_path: &str,
    output_path: &str,
    quality: Option<u8>,
    level: Option<&str>,
) -> Result<ConversionResult, AppError> {
    let start = Instant::now();
    let in_file = Path::new(input_path);
    if !in_file.exists() {
        return Err(AppError::FileNotFound(input_path.to_string()));
    }

    let orig_meta = fs::metadata(in_file)?;
    if orig_meta.len() == 0 {
        return Err(AppError::CorruptedFile("Berkas gambar berukuran 0 byte".into()));
    }

    let q = quality.unwrap_or_else(|| match level.unwrap_or("medium").to_lowercase().as_str() {
        "low" => 40,
        "high" => 85,
        _ => 70, // medium
    }).clamp(1, 100);

    let img = image::open(in_file).map_err(|e| {
        AppError::CorruptedFile(format!("Gagal membaca berkas gambar: {}", e))
    })?;

    let out_file_path = Path::new(output_path);
    if let Some(parent) = out_file_path.parent() {
        fs::create_dir_all(parent)?;
    }

    let ext = out_file_path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("jpg")
        .to_lowercase();

    let out_file = File::create(out_file_path)?;
    let mut writer = BufWriter::new(out_file);

    match ext.as_str() {
        "png" => {
            let compression = match q {
                1..=50 => CompressionType::Fast,
                51..=80 => CompressionType::Default,
                _ => CompressionType::Best,
            };
            let encoder = PngEncoder::new_with_quality(&mut writer, compression, FilterType::Adaptive);
            img.write_with_encoder(encoder).map_err(|e| {
                AppError::ExecutionError(format!("Gagal mengompresi PNG: {}", e))
            })?;
        }
        "webp" => {
            img.write_to(&mut writer, ImageFormat::WebP).map_err(|e| {
                AppError::ExecutionError(format!("Gagal mengompresi WebP: {}", e))
            })?;
        }
        _ => {
            // Default to JPEG
            let mut encoder = JpegEncoder::new_with_quality(&mut writer, q);
            if img.color().has_alpha() {
                let rgb = img.to_rgb8();
                encoder.encode_image(&rgb).map_err(|e| {
                    AppError::ExecutionError(format!("Gagal mengompresi JPEG: {}", e))
                })?;
            } else {
                encoder.encode_image(&img).map_err(|e| {
                    AppError::ExecutionError(format!("Gagal mengompresi JPEG: {}", e))
                })?;
            }
        }
    }

    drop(writer);

    let comp_meta = fs::metadata(out_file_path)?;
    let orig_size = orig_meta.len();
    let comp_size = comp_meta.len();
    let reduction = if orig_size > 0 && orig_size > comp_size {
        ((orig_size - comp_size) as f64 / orig_size as f64) * 100.0
    } else {
        0.0
    };

    Ok(ConversionResult {
        success: true,
        output_path: out_file_path.to_string_lossy().to_string(),
        duration_ms: start.elapsed().as_millis(),
        file_size_bytes: comp_size,
        total_pages: 1,
        original_size_bytes: Some(orig_size),
        compressed_size_bytes: Some(comp_size),
        reduction_percent: Some((reduction * 10.0).round() / 10.0),
    })
}

