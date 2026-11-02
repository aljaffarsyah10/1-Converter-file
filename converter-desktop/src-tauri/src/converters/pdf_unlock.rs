use crate::errors::AppError;
use crate::models::ConversionResult;
use lopdf::Document;
use std::fs;
use std::path::Path;
use std::time::Instant;

pub fn unlock_pdf(
    input_path: &str,
    output_path: &str,
    password: &str,
) -> Result<ConversionResult, AppError> {
    let start = Instant::now();
    let in_file = Path::new(input_path);
    if !in_file.exists() {
        return Err(AppError::FileNotFound(input_path.to_string()));
    }

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

    let in_meta = fs::metadata(in_file)?;
    if in_meta.len() == 0 {
        return Err(AppError::CorruptedFile("Berkas PDF berukuran 0 byte".into()));
    }

    if password.trim().is_empty() {
        return Err(AppError::InvalidPassword("Kata sandi tidak boleh kosong".into()));
    }

    let mut doc = Document::load(in_file).map_err(|e| {
        AppError::CorruptedFile(format!("Gagal membaca berkas PDF: {}", e))
    })?;

    if !doc.is_encrypted() {
        return Err(AppError::ExecutionError(
            "Dokumen PDF tidak terenkripsi / tidak memiliki password".into(),
        ));
    }

    doc.decrypt(password).map_err(|e| {
        AppError::InvalidPassword(format!("Kata sandi salah atau tidak dapat membuka enkripsi: {}", e))
    })?;

    let total_pages = doc.get_pages().len();

    let out_file = Path::new(output_path);
    if let Some(parent) = out_file.parent() {
        fs::create_dir_all(parent)?;
    }

    doc.save(out_file).map_err(|e| {
        AppError::ExecutionError(format!("Gagal menyimpan berkas PDF yang dibuka kuncinya: {}", e))
    })?;

    let out_meta = fs::metadata(out_file)?;
    Ok(ConversionResult {
        success: true,
        output_path: out_file.to_string_lossy().to_string(),
        duration_ms: start.elapsed().as_millis(),
        file_size_bytes: out_meta.len(),
        total_pages,
        ..Default::default()
    })
}
