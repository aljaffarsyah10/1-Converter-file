use crate::models::{
    CompressPdfRequest, ConversionResult, ExcelToPdfRequest, ImageToPdfRequest, MergePdfRequest,
    PdfToExcelRequest, PdfToImageRequest, PdfToWordRequest, PptxToPdfRequest, ProtectPdfRequest,
    RotatePdfRequest,
    SplitPdfRequest, UnlockPdfRequest, WordToPdfRequest,
};
use crate::services::conversion_service;
use tauri::AppHandle;

#[tauri::command]
pub async fn convert_merge_pdf(
    app: AppHandle,
    job_id: String,
    request: MergePdfRequest,
) -> Result<ConversionResult, String> {
    tauri::async_runtime::spawn_blocking(move || {
        conversion_service::execute_merge_pdf(app, job_id, request)
    })
    .await
    .map_err(|e| format!("Task execution error: {}", e))?
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn convert_split_pdf(
    app: AppHandle,
    job_id: String,
    request: SplitPdfRequest,
) -> Result<ConversionResult, String> {
    tauri::async_runtime::spawn_blocking(move || {
        conversion_service::execute_split_pdf(app, job_id, request)
    })
    .await
    .map_err(|e| format!("Task execution error: {}", e))?
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn convert_image_to_pdf(
    app: AppHandle,
    job_id: String,
    request: ImageToPdfRequest,
) -> Result<ConversionResult, String> {
    tauri::async_runtime::spawn_blocking(move || {
        conversion_service::execute_image_to_pdf(app, job_id, request)
    })
    .await
    .map_err(|e| format!("Task execution error: {}", e))?
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn convert_word_to_pdf(
    app: AppHandle,
    job_id: String,
    request: WordToPdfRequest,
) -> Result<ConversionResult, String> {
    tauri::async_runtime::spawn_blocking(move || {
        conversion_service::execute_word_to_pdf(app, job_id, request)
    })
    .await
    .map_err(|e| format!("Task execution error: {}", e))?
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn convert_pdf_to_word(
    app: AppHandle,
    job_id: String,
    request: PdfToWordRequest,
) -> Result<ConversionResult, String> {
    tauri::async_runtime::spawn_blocking(move || {
        conversion_service::execute_pdf_to_word(app, job_id, request)
    })
    .await
    .map_err(|e| format!("Task execution error: {}", e))?
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn convert_pdf_to_image(
    app: AppHandle,
    job_id: String,
    request: PdfToImageRequest,
) -> Result<ConversionResult, String> {
    tauri::async_runtime::spawn_blocking(move || {
        conversion_service::execute_pdf_to_image(app, job_id, request)
    })
    .await
    .map_err(|e| format!("Task execution error: {}", e))?
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn convert_compress_pdf(
    app: AppHandle,
    job_id: String,
    request: CompressPdfRequest,
) -> Result<ConversionResult, String> {
    tauri::async_runtime::spawn_blocking(move || {
        conversion_service::execute_compress_pdf(app, job_id, request)
    })
    .await
    .map_err(|e| format!("Task execution error: {}", e))?
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn convert_excel_to_pdf(
    app: AppHandle,
    job_id: String,
    request: ExcelToPdfRequest,
) -> Result<ConversionResult, String> {
    tauri::async_runtime::spawn_blocking(move || {
        conversion_service::execute_excel_to_pdf(app, job_id, request)
    })
    .await
    .map_err(|e| format!("Task execution error: {}", e))?
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn convert_pptx_to_pdf(
    app: AppHandle,
    job_id: String,
    request: PptxToPdfRequest,
) -> Result<ConversionResult, String> {
    tauri::async_runtime::spawn_blocking(move || {
        conversion_service::execute_pptx_to_pdf(app, job_id, request)
    })
    .await
    .map_err(|e| format!("Task execution error: {}", e))?
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn convert_pdf_to_excel(
    app: AppHandle,
    job_id: String,
    request: PdfToExcelRequest,
) -> Result<ConversionResult, String> {
    tauri::async_runtime::spawn_blocking(move || {
        conversion_service::execute_pdf_to_excel(app, job_id, request)
    })
    .await
    .map_err(|e| format!("Task execution error: {}", e))?
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn convert_rotate_pdf(
    app: AppHandle,
    job_id: String,
    request: RotatePdfRequest,
) -> Result<ConversionResult, String> {
    tauri::async_runtime::spawn_blocking(move || {
        conversion_service::execute_rotate_pdf(app, job_id, request)
    })
    .await
    .map_err(|e| format!("Task execution error: {}", e))?
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn convert_protect_pdf(
    app: AppHandle,
    job_id: String,
    request: ProtectPdfRequest,
) -> Result<ConversionResult, String> {
    tauri::async_runtime::spawn_blocking(move || {
        conversion_service::execute_protect_pdf(app, job_id, request)
    })
    .await
    .map_err(|e| format!("Task execution error: {}", e))?
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn convert_unlock_pdf(
    app: AppHandle,
    job_id: String,
    request: UnlockPdfRequest,
) -> Result<ConversionResult, String> {
    tauri::async_runtime::spawn_blocking(move || {
        conversion_service::execute_unlock_pdf(app, job_id, request)
    })
    .await
    .map_err(|e| format!("Task execution error: {}", e))?
    .map_err(|e| e.to_string())
}

