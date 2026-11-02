use crate::converters::{docx_to_pdf, image_to_pdf, pdf_merge, pdf_split};
use crate::errors::AppError;
use crate::models::{
    ConversionResult, ImageToPdfRequest, MergePdfRequest, ProgressEvent, SplitPdfRequest,
    WordToPdfRequest,
};
use tauri::{AppHandle, Emitter};

pub fn emit_progress(app: &AppHandle, job_id: &str, percent: u32, stage: &str) {
    let payload = ProgressEvent {
        job_id: job_id.to_string(),
        percent,
        stage: stage.to_string(),
    };
    let _ = app.emit("conversion-progress", payload);
}

pub fn execute_merge_pdf(
    app: AppHandle,
    job_id: String,
    req: MergePdfRequest,
) -> Result<ConversionResult, AppError> {
    emit_progress(&app, &job_id, 10, "Memvalidasi berkas PDF input...");
    let result = pdf_merge::merge_pdf_files(&req.input_paths, &req.output_path)?;
    emit_progress(&app, &job_id, 100, "Penggabungan PDF selesai");
    Ok(result)
}

pub fn execute_split_pdf(
    app: AppHandle,
    job_id: String,
    req: SplitPdfRequest,
) -> Result<ConversionResult, AppError> {
    emit_progress(&app, &job_id, 10, "Menganalisis halaman PDF...");
    let result = pdf_split::split_pdf_file(
        &req.input_path,
        &req.output_dir,
        &req.output_prefix,
        &req.mode,
        req.page_range.as_deref(),
    )?;
    emit_progress(&app, &job_id, 100, "Pemotongan PDF selesai");
    Ok(result)
}

pub fn execute_image_to_pdf(
    app: AppHandle,
    job_id: String,
    req: ImageToPdfRequest,
) -> Result<ConversionResult, AppError> {
    emit_progress(&app, &job_id, 15, "Mendekode gambar dan menghitung dimensi...");
    let result = image_to_pdf::convert_images_to_pdf(
        &req.input_paths,
        &req.output_path,
        req.orientation.as_deref(),
        req.margin.as_deref(),
    )?;
    emit_progress(&app, &job_id, 100, "Konversi gambar ke PDF selesai");
    Ok(result)
}

pub fn execute_word_to_pdf(
    app: AppHandle,
    job_id: String,
    req: WordToPdfRequest,
) -> Result<ConversionResult, AppError> {
    emit_progress(&app, &job_id, 15, "Menyiapkan engine dokumen Office...");
    let result = docx_to_pdf::convert_docx_to_pdf(&req.input_path, &req.output_path)?;
    emit_progress(&app, &job_id, 100, "Konversi DOCX ke PDF selesai");
    Ok(result)
}

