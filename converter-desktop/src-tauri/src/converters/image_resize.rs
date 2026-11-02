use crate::errors::AppError;
use crate::models::ConversionResult;
use image::imageops::FilterType;
use std::fs;
use std::path::Path;
use std::time::Instant;

pub fn resize_image_file(
    input_path: &str,
    output_path: &str,
    width: Option<u32>,
    height: Option<u32>,
    scale_percent: Option<f64>,
    maintain_aspect_ratio: Option<bool>,
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

    let img = image::open(in_file).map_err(|e| {
        AppError::CorruptedFile(format!("Gagal membaca berkas gambar: {}", e))
    })?;

    let orig_w = img.width();
    let orig_h = img.height();

    let (target_w, target_h, keep_ratio) = if let Some(scale) = scale_percent {
        let factor = (scale / 100.0).clamp(0.01, 50.0);
        let nw = ((orig_w as f64) * factor).round().max(1.0) as u32;
        let nh = ((orig_h as f64) * factor).round().max(1.0) as u32;
        (nw, nh, true)
    } else {
        let keep = maintain_aspect_ratio.unwrap_or(true);
        match (width, height) {
            (Some(w), Some(h)) => (w.max(1), h.max(1), keep),
            (Some(w), None) => {
                let nh = ((orig_h as f64 * w as f64) / orig_w as f64).round().max(1.0) as u32;
                (w.max(1), nh, true)
            }
            (None, Some(h)) => {
                let nw = ((orig_w as f64 * h as f64) / orig_h as f64).round().max(1.0) as u32;
                (nw, h.max(1), true)
            }
            (None, None) => {
                return Err(AppError::ExecutionError(
                    "Harus menentukan dimensi lebar, tinggi, atau persentase skala".into(),
                ));
            }
        }
    };

    let resized = if keep_ratio {
        img.resize(target_w, target_h, FilterType::Lanczos3)
    } else {
        img.resize_exact(target_w, target_h, FilterType::Lanczos3)
    };

    let out_file_path = Path::new(output_path);
    if let Some(parent) = out_file_path.parent() {
        fs::create_dir_all(parent)?;
    }

    resized.save(out_file_path).map_err(|e| {
        AppError::ExecutionError(format!("Gagal menyimpan gambar hasil resize: {}", e))
    })?;

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

