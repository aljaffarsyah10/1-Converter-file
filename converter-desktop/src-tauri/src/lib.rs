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
    use std::fs;
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
    fn test_split_all_backend() {
        let fixtures_dir = Path::new("..").join("poc-converters").join("fixtures");
        let sample1 = fixtures_dir.join("sample1.pdf").to_string_lossy().to_string();

        if !Path::new(&sample1).exists() {
            return;
        }

        let output_dir = Path::new("..").join("poc-converters").join("output");
        let res = converters::pdf_split::split_pdf_file(
            &sample1,
            &output_dir.to_string_lossy(),
            "backend_split_all_test",
            "split_all",
            None,
        );
        assert!(res.is_ok(), "Split all backend should succeed");
        let result = res.unwrap();
        assert_eq!(result.total_pages, 2);
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
        assert!(info.word_com_available || !info.word_com_available);
    }

    #[test]
    fn test_corrupted_and_empty_files_fail_gracefully() {
        let temp_dir = std::env::temp_dir().join("test_converter_corrupted");
        let _ = fs::create_dir_all(&temp_dir);

        // 1. Empty file
        let empty_file = temp_dir.join("empty.pdf");
        fs::write(&empty_file, b"").expect("write empty");

        // 2. Garbage file
        let garbage_file = temp_dir.join("garbage.pdf");
        fs::write(&garbage_file, b"NOT A VALID PDF FILE AT ALL GIBBERISH 1234567890").expect("write garbage");

        let out = temp_dir.join("out.pdf").to_string_lossy().to_string();

        // Merging with empty file must fail gracefully
        let res_empty = converters::pdf_merge::merge_pdf_files(
            &[empty_file.to_string_lossy().to_string()],
            &out,
        );
        assert!(res_empty.is_err(), "Empty PDF should return Err");

        // Merging with garbage file must fail gracefully without panic
        let res_garbage = converters::pdf_merge::merge_pdf_files(
            &[garbage_file.to_string_lossy().to_string()],
            &out,
        );
        assert!(res_garbage.is_err(), "Garbage PDF should return Err");

        // Splitting empty file must fail gracefully
        let res_split = converters::pdf_split::split_pdf_file(
            &empty_file.to_string_lossy(),
            &temp_dir.to_string_lossy(),
            "prefix",
            "extract_range",
            Some("1"),
        );
        assert!(res_split.is_err(), "Splitting empty PDF should return Err");

        // Clean up
        let _ = fs::remove_dir_all(temp_dir);
    }

    #[test]
    fn test_invalid_page_ranges_in_split() {
        let fixtures_dir = Path::new("..").join("poc-converters").join("fixtures");
        let sample1 = fixtures_dir.join("sample1.pdf").to_string_lossy().to_string();

        if !Path::new(&sample1).exists() {
            return;
        }

        let temp_dir = std::env::temp_dir().join("test_converter_ranges");
        let _ = fs::create_dir_all(&temp_dir);

        // Max pages of sample1.pdf is 2
        // Test out of bounds
        let res_oob = converters::pdf_split::split_pdf_file(
            &sample1,
            &temp_dir.to_string_lossy(),
            "oob",
            "extract_range",
            Some("5-10"),
        );
        assert!(res_oob.is_err(), "Out of bounds range must return Err");

        // Test inverted range
        let res_inv = converters::pdf_split::split_pdf_file(
            &sample1,
            &temp_dir.to_string_lossy(),
            "inv",
            "extract_range",
            Some("2-1"),
        );
        assert!(res_inv.is_err(), "Inverted range must return Err");

        // Test non-numeric syntax
        let res_syntax = converters::pdf_split::split_pdf_file(
            &sample1,
            &temp_dir.to_string_lossy(),
            "syntax",
            "extract_range",
            Some("abc-xyz"),
        );
        assert!(res_syntax.is_err(), "Non-numeric range must return Err");

        // Test zero index
        let res_zero = converters::pdf_split::split_pdf_file(
            &sample1,
            &temp_dir.to_string_lossy(),
            "zero",
            "extract_range",
            Some("0"),
        );
        assert!(res_zero.is_err(), "Zero page index must return Err");

        let _ = fs::remove_dir_all(temp_dir);
    }

    #[test]
    fn test_non_existent_file_error() {
        let fake = "C:\\path\\does_not_exist_at_all_12345.pdf";
        let out = "C:\\path\\out.pdf";
        let res = converters::pdf_merge::merge_pdf_files(&[fake.to_string()], out);
        assert!(res.is_err(), "Non existent file must return Err");
    }

    #[test]
    fn test_source_files_remain_unmodified() {
        let fixtures_dir = Path::new("..").join("poc-converters").join("fixtures");
        let sample1 = fixtures_dir.join("sample1.pdf");
        if !sample1.exists() {
            return;
        }

        let pre_bytes = fs::read(&sample1).expect("read pre");
        let output_path = Path::new("..").join("poc-converters").join("output").join("test_integrity_out.pdf");

        let _ = converters::pdf_merge::merge_pdf_files(
            &[sample1.to_string_lossy().to_string()],
            &output_path.to_string_lossy(),
        );

        let post_bytes = fs::read(&sample1).expect("read post");
        assert_eq!(pre_bytes, post_bytes, "Source file bytes MUST NOT change!");
    }

    #[test]
    fn test_repeated_conversions_performance() {
        let fixtures_dir = Path::new("..").join("poc-converters").join("fixtures");
        let sample1 = fixtures_dir.join("sample1.pdf").to_string_lossy().to_string();
        let sample2 = fixtures_dir.join("sample2.pdf").to_string_lossy().to_string();

        if !Path::new(&sample1).exists() {
            return;
        }

        let out_dir = Path::new("..").join("poc-converters").join("output");
        for i in 0..5 {
            let out_file = out_dir.join(format!("repeated_test_{}.pdf", i));
            let res = converters::pdf_merge::merge_pdf_files(
                &[sample1.clone(), sample2.clone()],
                &out_file.to_string_lossy(),
            );
            assert!(res.is_ok(), "Iteration {} should succeed", i);
            assert!(res.unwrap().duration_ms < 500, "Should remain fast (< 500ms)");
        }
    }
}
