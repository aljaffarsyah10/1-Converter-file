use crate::converters::docx_to_pdf;
use crate::models::SystemEngineInfo;
use std::fs;
use std::path::PathBuf;

#[tauri::command]
pub fn get_system_engine_info() -> SystemEngineInfo {
    let (_, info) = docx_to_pdf::detect_docx_engine();
    info
}

#[tauri::command]
pub fn get_default_output_dir() -> String {
    let mut path = if let Ok(user_profile) = std::env::var("USERPROFILE") {
        PathBuf::from(user_profile).join("Downloads").join("Converted")
    } else {
        PathBuf::from(".").join("Converted")
    };

    let _ = fs::create_dir_all(&path);
    path.to_string_lossy().to_string()
}

