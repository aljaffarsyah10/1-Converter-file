pub mod commands;
pub mod converters;
pub mod errors;
pub mod models;
pub mod services;

use commands::convert::{
    convert_image_to_pdf, convert_merge_pdf, convert_split_pdf, convert_word_to_pdf,
};
use commands::system::{get_default_output_dir, get_files_metadata, get_system_engine_info};

// Keep greet for backwards compatibility if needed
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            convert_merge_pdf,
            convert_split_pdf,
            convert_image_to_pdf,
            convert_word_to_pdf,
            get_system_engine_info,
            get_default_output_dir,
            get_files_metadata,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::Path;

    #[test]
    fn test_merge_pdf_backend() {
        let fixtures_dir = Path::new("..").join("poc-converters").join("fixtures");
        let sample1 = fixtures_dir.join("sample1.pdf").to_string_lossy().to_string();
        let sample2 = fixtures_dir.join("sample2.pdf").to_string_lossy().to_string();

        if !Path::new(&sample1).exists() {
            println!("Fixtures not found, skipping fixture test");
            return;
        }

        let output_path = Path::new("..").join("poc-converters").join("output").join("backend_test_merge.pdf");
        let res = converters::pdf_merge::merge_pdf_files(&[sample1, sample2], &output_path.to_string_lossy());
        assert!(res.is_ok(), "Merge PDF backend should succeed");
        let result = res.unwrap();
        assert_eq!(result.total_pages, 4);
        assert!(result.file_size_bytes > 0);
    }

    #[test]
    fn test_split_pdf_backend() {
        let fixtures_dir = Path::new("..").join("poc-converters").join("fixtures");
        let sample1 = fixtures_dir.join("sample1.pdf").to_string_lossy().to_string();

        if !Path::new(&sample1).exists() {
            return;
        }

        let output_dir = Path::new("..").join("poc-converters").join("output");
        let res = converters::pdf_split::split_pdf_file(
            &sample1,
            &output_dir.to_string_lossy(),
            "backend_split_test",
            "extract_range",
            Some("1"),
        );
        assert!(res.is_ok(), "Split PDF backend should succeed");
        let result = res.unwrap();
        assert_eq!(result.total_pages, 1);
    }

    #[test]
    fn test_image_to_pdf_backend() {
        let fixtures_dir = Path::new("..").join("poc-converters").join("fixtures");
        let png = fixtures_dir.join("sample.png").to_string_lossy().to_string();
        let jpg = fixtures_dir.join("sample.jpg").to_string_lossy().to_string();

        if !Path::new(&png).exists() {
            return;
        }

        let output_path = Path::new("..").join("poc-converters").join("output").join("backend_test_img.pdf");
        let res = converters::image_to_pdf::convert_images_to_pdf(
            &[png, jpg],
            &output_path.to_string_lossy(),
            Some("auto"),
            Some("small"),
        );
        assert!(res.is_ok(), "Image to PDF backend should succeed");
        let result = res.unwrap();
        assert_eq!(result.total_pages, 2);
    }

    #[test]
    fn test_system_engine_detection() {
        let info = commands::system::get_system_engine_info();
        println!("Detected engines: {:?}", info);
        // Either Word COM or LibreOffice should be detected or valid boolean
        assert!(info.word_com_available || !info.word_com_available);
    }
}
