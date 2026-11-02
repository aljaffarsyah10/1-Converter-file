use crate::errors::AppError;
use crate::models::ConversionResult;
use image::ImageFormat;
use std::fs::{self, File};
use std::io::BufWriter;
use std::path::Path;
use std::time::Instant;

pub fn convert_image_format(
    input_path: &str,
    output_path: &str,
    target_format: &str,
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

    let format_clean = target_format.trim().to_lowercase();
    let image_format = match format_clean.as_str() {
        "jpg" | "jpeg" => ImageFormat::Jpeg,
        "png" => ImageFormat::Png,
        "webp" => ImageFormat::WebP,
        "bmp" => ImageFormat::Bmp,
        _ => {
            return Err(AppError::InvalidFileFormat {
                expected: "jpg, png, webp, bmp".into(),
                actual: format_clean,
            });
        }
    };

    let img = image::open(in_file).map_err(|e| {
        AppError::CorruptedFile(format!("Gagal membaca berkas gambar: {}", e))
    })?;

    let out_file_path = Path::new(output_path);
    if let Some(parent) = out_file_path.parent() {
        fs::create_dir_all(parent)?;
    }

    let out_file = File::create(out_file_path)?;
    let mut writer = BufWriter::new(out_file);

    if image_format == ImageFormat::Jpeg && img.color().has_alpha() {
        let rgb = img.to_rgb8();
        rgb.write_to(&mut writer, image_format).map_err(|e| {
            AppError::ExecutionError(format!("Gagal menyimpan gambar format JPEG: {}", e))
        })?;
    } else {
        img.write_to(&mut writer, image_format).map_err(|e| {
            AppError::ExecutionError(format!("Gagal menyimpan gambar format {}: {}", format_clean, e))
        })?;
    }

    drop(writer);

    let out_meta = fs::metadata(out_file_path)?;
    Ok(ConversionResult {
        success: true,
        output_path: out_file_path.to_string_lossy().to_string(),
        duration_ms: start.elapsed().as_millis(),
        file_size_bytes: out_meta.len(),
        total_pages: 1,
        ..Default::default()
    })
}

