use crate::errors::AppError;
use crate::models::{
    ConversionResult, ImageToPdfRequest, MergePdfRequest, SplitPdfRequest, WordToPdfRequest,
};
use crate::services::conversion_service;
use tauri::AppHandle;

#[tauri::command]
pub async fn convert_merge_pdf(
    app: AppHandle,
    job_id: String,
    request: MergePdfRequest,
) -> Result<ConversionResult, String> {
    tokio::task::spawn_blocking(move || {
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
    tokio::task::spawn_blocking(move || {
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
    tokio::task::spawn_blocking(move || {
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
    tokio::task::spawn_blocking(move || {
        conversion_service::execute_word_to_pdf(app, job_id, request)
    })
    .await
    .map_err(|e| format!("Task execution error: {}", e))?
    .map_err(|e| e.to_string())
}

