use crate::converters::pdf_split::parse_page_range;
use crate::errors::AppError;
use crate::models::ConversionResult;
use pdf_render::pdf_interpret::InterpreterSettings;
use pdf_render::pdf_interpret::pdf_syntax::Pdf;
use pdf_render::vello_cpu::color::palette::css::WHITE;
use pdf_render::{render, RenderSettings};
use std::fs;
use std::path::{Path, PathBuf};
use std::time::Instant;

pub fn convert_pdf_to_images(
    input_path: &str,
    output_dir: &str,
    output_prefix: Option<&str>,
    format_opt: Option<&str>,
    dpi_opt: Option<u32>,
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

    // Read bytes
    let pdf_bytes = fs::read(in_file)?;
    let pdf = Pdf::new(pdf_bytes)
        .map_err(|e| AppError::CorruptedFile(format!("Gagal membaca berkas PDF: {:?}", e)))?;

    let pages = pdf.pages();
    let total_pages = pages.len();
    if total_pages == 0 {
        return Err(AppError::CorruptedFile(
            "Dokumen PDF tidak memiliki halaman yang valid".into(),
        ));
    }

    // Determine target page indices (1-based)
    let selected_pages: Vec<u32> = if let Some(range_str) = page_range {
        let trimmed = range_str.trim();
        if trimmed.is_empty() {
            (1..=total_pages as u32).collect()
        } else {
            parse_page_range(trimmed, total_pages)?
        }
    } else {
        (1..=total_pages as u32).collect()
    };

    // Ensure output directory exists
    let out_dir = PathBuf::from(output_dir);
    if !out_dir.exists() {
        fs::create_dir_all(&out_dir)?;
    }

    let prefix = output_prefix
        .filter(|p| !p.trim().is_empty())
        .map(|p| p.to_string())
        .unwrap_or_else(|| {
            in_file
                .file_stem()
                .map(|s| s.to_string_lossy().to_string())
                .unwrap_or_else(|| "page".to_string())
        });

    let format_clean = format_opt
        .unwrap_or("png")
        .trim()
        .to_lowercase();
    let is_jpg = format_clean == "jpg" || format_clean == "jpeg";
    let file_ext = if is_jpg { "jpg" } else { "png" };

    // Scale calculation: PDF base is 72 pt/inch
    let dpi = dpi_opt.unwrap_or(150);
    let scale = (dpi as f32) / 72.0;

    let mut total_bytes_written: u64 = 0;
    let mut first_output_path = String::new();

    for &page_num in &selected_pages {
        let page_idx = (page_num - 1) as usize;
        let page = &pages[page_idx];

        let pixmap = render(
            page,
            &InterpreterSettings::default(),
            &RenderSettings {
                x_scale: scale,
                y_scale: scale,
                bg_color: WHITE,
                ..Default::default()
            },
        );

        let width = pixmap.width() as u32;
        let height = pixmap.height() as u32;

        let rgba_buf = image::ImageBuffer::<image::Rgba<u8>, _>::from_raw(
            width,
            height,
            pixmap.data_as_u8_slice().to_vec(),
        )
        .ok_or_else(|| AppError::ExecutionError("Gagal mengalokasikan buffer piksel gambar".into()))?;

        let file_name = format!("{}_page_{}.{}", prefix, page_num, file_ext);
        let out_file_path = out_dir.join(file_name);
        let out_file_str = out_file_path.to_string_lossy().to_string();

        if is_jpg {
            let rgb_img = image::DynamicImage::ImageRgba8(rgba_buf).to_rgb8();
            rgb_img
                .save(&out_file_path)
                .map_err(|e| AppError::ExecutionError(format!("Gagal menyimpan gambar JPEG: {}", e)))?;
        } else {
            rgba_buf
                .save(&out_file_path)
                .map_err(|e| AppError::ExecutionError(format!("Gagal menyimpan gambar PNG: {}", e)))?;
        }

        let meta = fs::metadata(&out_file_path)?;
        total_bytes_written += meta.len();

        if first_output_path.is_empty() {
            first_output_path = out_file_str;
        }
    }

    Ok(ConversionResult {
        success: true,
        output_path: if selected_pages.len() == 1 {
            first_output_path
        } else {
            out_dir.to_string_lossy().to_string()
        },
        duration_ms: start.elapsed().as_millis(),
        file_size_bytes: total_bytes_written,
        total_pages: selected_pages.len(),
    })
}
