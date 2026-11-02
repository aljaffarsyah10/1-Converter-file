use crate::converters::docx_to_pdf;
use crate::models::{FileMetadata, SystemEngineInfo};
use std::fs;
use std::path::{Path, PathBuf};
use std::time::UNIX_EPOCH;

#[tauri::command]
pub fn get_system_engine_info() -> SystemEngineInfo {
    let (_, info) = docx_to_pdf::detect_docx_engine();
    info
}

#[tauri::command]
pub fn get_default_output_dir() -> String {
    let path = if let Ok(user_profile) = std::env::var("USERPROFILE") {
        PathBuf::from(user_profile).join("Downloads").join("Converted")
    } else {
        PathBuf::from(".").join("Converted")
    };

    let _ = fs::create_dir_all(&path);
    path.to_string_lossy().to_string()
}

fn format_bytes(bytes: u64) -> String {
    if bytes == 0 {
        return "0 B".to_string();
    }
    let units = ["B", "KB", "MB", "GB"];
    let mut size = bytes as f64;
    let mut unit_idx = 0;
    while size >= 1024.0 && unit_idx < units.len() - 1 {
        size /= 1024.0;
        unit_idx += 1;
    }
    format!("{:.1} {}", size, units[unit_idx])
}

#[tauri::command]
pub fn get_files_metadata(paths: Vec<String>) -> Vec<FileMetadata> {
    let mut list = Vec::new();

    for p in paths {
        let path = Path::new(&p);
        if let Ok(meta) = fs::metadata(path) {
            let size = meta.len();
            let size_formatted = format_bytes(size);
            let name = path
                .file_name()
                .map(|n| n.to_string_lossy().to_string())
                .unwrap_or_else(|| p.clone());
            let format = path
                .extension()
                .map(|e| e.to_string_lossy().to_uppercase())
                .unwrap_or_default();
            let last_modified = meta
                .modified()
                .ok()
                .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
                .map(|d| d.as_millis() as u64)
                .unwrap_or(0);

            list.push(FileMetadata {
                id: format!("{}-{}", name, last_modified),
                name,
                path: p,
                size,
                size_formatted,
                format,
                last_modified,
            });
        }
    }

    list
}

