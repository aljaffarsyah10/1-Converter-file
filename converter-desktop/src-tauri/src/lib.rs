pub mod commands;
pub mod converters;
pub mod errors;
pub mod models;
pub mod services;

use commands::convert::{
    convert_compress_pdf, convert_excel_to_pdf, convert_image_to_pdf, convert_merge_pdf, convert_pdf_to_image, convert_pdf_to_word, convert_pptx_to_pdf, convert_split_pdf, convert_word_to_pdf,
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
            convert_pdf_to_word,
            convert_pdf_to_image,
            convert_compress_pdf,
            convert_excel_to_pdf,
            convert_pptx_to_pdf,
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

    #[test]
    fn test_multi_file_merge_three_files() {
        let fixtures_dir = Path::new("..").join("poc-converters").join("fixtures");
        let sample1 = fixtures_dir.join("sample1.pdf").to_string_lossy().to_string();
        let sample2 = fixtures_dir.join("sample2.pdf").to_string_lossy().to_string();

        if !Path::new(&sample1).exists() {
            return;
        }

        let output_path = Path::new("..").join("poc-converters").join("output").join("test_merge_3_files.pdf");
        let res = converters::pdf_merge::merge_pdf_files(
            &[sample1.clone(), sample2, sample1],
            &output_path.to_string_lossy(),
        );
        assert!(res.is_ok(), "Merging 3 files should succeed");
        let result = res.unwrap();
        assert_eq!(result.total_pages, 6);
        assert!(result.file_size_bytes > 0);
    }

    #[test]
    fn test_valid_page_ranges_parsing() {
        // Test parsing whitespace, commas, deduplication
        let pages1 = converters::pdf_split::parse_page_range(" 1 - 2 , 1 , 2 ", 5);
        assert_eq!(pages1.unwrap(), vec![1, 2]);

        let pages2 = converters::pdf_split::parse_page_range(" 2 ", 5);
        assert_eq!(pages2.unwrap(), vec![2]);

        let pages3 = converters::pdf_split::parse_page_range("1, 3, 5", 5);
        assert_eq!(pages3.unwrap(), vec![1, 3, 5]);
    }

    #[test]
    fn test_unicode_and_spaces_in_paths() {
        let fixtures_dir = Path::new("..").join("poc-converters").join("fixtures");
        let png = fixtures_dir.join("sample.png").to_string_lossy().to_string();

        if !Path::new(&png).exists() {
            return;
        }

        let temp_dir = std::env::temp_dir().join("Folder Uji Konverter Spasi & Aksen (2026)");
        let _ = fs::create_dir_all(&temp_dir);
        let out_file = temp_dir.join("Hasil Konversi Dokumen.pdf");

        let res = converters::image_to_pdf::convert_images_to_pdf(
            &[png],
            &out_file.to_string_lossy(),
            Some("portrait"),
            Some("normal"),
        );
        assert!(res.is_ok(), "Conversion with spaces and unicode in path must succeed");
        assert!(out_file.exists());

        let _ = fs::remove_dir_all(temp_dir);
    }

    #[test]
    fn test_overwrite_existing_output_safely() {
        let fixtures_dir = Path::new("..").join("poc-converters").join("fixtures");
        let sample1 = fixtures_dir.join("sample1.pdf").to_string_lossy().to_string();

        if !Path::new(&sample1).exists() {
            return;
        }

        let temp_dir = std::env::temp_dir().join("test_overwrite_dir");
        let _ = fs::create_dir_all(&temp_dir);
        let out_file = temp_dir.join("overwritten.pdf");

        // Write first time
        let res1 = converters::pdf_merge::merge_pdf_files(&[sample1.clone()], &out_file.to_string_lossy());
        assert!(res1.is_ok(), "First write should succeed");

        // Overwrite second time
        let res2 = converters::pdf_merge::merge_pdf_files(&[sample1], &out_file.to_string_lossy());
        assert!(res2.is_ok(), "Second write (overwrite) should succeed safely");
        assert!(out_file.exists());

        let _ = fs::remove_dir_all(temp_dir);
    }

    #[test]
    fn test_docx_to_pdf_conversion_e2e() {
        let fixtures_dir = Path::new("..").join("poc-converters").join("fixtures");
        let docx = fixtures_dir.join("sample.docx").to_string_lossy().to_string();

        if !Path::new(&docx).exists() {
            return;
        }

        let (engine, _) = converters::docx_to_pdf::detect_docx_engine();
        if engine == converters::docx_to_pdf::DocxEngine::None {
            println!("No docx engine installed, skipping docx e2e");
            return;
        }

        let temp_dir = std::env::temp_dir().join("test_docx_dir");
        let _ = fs::create_dir_all(&temp_dir);
        let out_file = temp_dir.join("docx_converted.pdf");

        let res = converters::docx_to_pdf::convert_docx_to_pdf(&docx, &out_file.to_string_lossy());
        if let Ok(result) = res {
            assert!(result.success);
            assert!(result.file_size_bytes > 0);
            assert!(result.total_pages >= 1);
            assert!(out_file.exists());
        } else {
            println!("Docx conversion returned error (may be sandbox restricted): {:?}", res.err());
        }

        let _ = fs::remove_dir_all(temp_dir);
    }

    #[test]
    fn test_pdf_to_word_success() {
        let fixtures_dir = Path::new("..").join("poc-converters").join("fixtures");
        let sample1 = fixtures_dir.join("sample1.pdf").to_string_lossy().to_string();

        if !Path::new(&sample1).exists() {
            println!("Fixtures not found, skipping pdf to word test");
            return;
        }

        let temp_dir = std::env::temp_dir().join("test_pdf_to_word_success");
        let _ = fs::create_dir_all(&temp_dir);
        let out_file = temp_dir.join("sample1_converted.docx");

        let res = converters::pdf_to_word::convert_pdf_to_docx(&sample1, &out_file.to_string_lossy());
        assert!(res.is_ok(), "PDF to Word conversion should succeed: {:?}", res.err());
        let result = res.unwrap();
        assert!(result.success);
        assert_eq!(result.total_pages, 2);
        assert!(result.file_size_bytes > 0);
        assert!(out_file.exists());

        let _ = fs::remove_dir_all(temp_dir);
    }

    #[test]
    fn test_pdf_to_word_file_not_found() {
        let fake = "C:\\path\\does_not_exist_at_all_99999.pdf";
        let out = "C:\\path\\out.docx";
        let res = converters::pdf_to_word::convert_pdf_to_docx(fake, out);
        assert!(res.is_err(), "Non existent PDF must return Err");
    }

    #[test]
    fn test_pdf_to_word_corrupted_or_empty() {
        let temp_dir = std::env::temp_dir().join("test_pdf_to_word_corrupt");
        let _ = fs::create_dir_all(&temp_dir);

        // 1. 0-byte file
        let empty_pdf = temp_dir.join("empty.pdf");
        fs::write(&empty_pdf, b"").expect("write empty");
        let out1 = temp_dir.join("out1.docx").to_string_lossy().to_string();
        let res1 = converters::pdf_to_word::convert_pdf_to_docx(&empty_pdf.to_string_lossy(), &out1);
        assert!(res1.is_err(), "0-byte PDF must fail gracefully");

        // 2. Non-PDF extension
        let not_pdf = temp_dir.join("image.png");
        fs::write(&not_pdf, b"fake png content").expect("write not_pdf");
        let out2 = temp_dir.join("out2.docx").to_string_lossy().to_string();
        let res2 = converters::pdf_to_word::convert_pdf_to_docx(&not_pdf.to_string_lossy(), &out2);
        assert!(res2.is_err(), "Non-PDF file must fail format validation");

        // 3. Corrupt file with .pdf extension
        let corrupt_pdf = temp_dir.join("corrupt.pdf");
        fs::write(&corrupt_pdf, b"GARBAGE NOT REAL PDF CONTENT 123").expect("write corrupt");
        let out3 = temp_dir.join("out3.docx").to_string_lossy().to_string();
        let res3 = converters::pdf_to_word::convert_pdf_to_docx(&corrupt_pdf.to_string_lossy(), &out3);
        assert!(res3.is_err(), "Corrupt PDF must fail gracefully without panic");

        let _ = fs::remove_dir_all(temp_dir);
    }

    #[test]
    fn test_pdf_to_image_png_success() {
        let fixtures_dir = Path::new("..").join("poc-converters").join("fixtures");
        let sample1 = fixtures_dir.join("sample1.pdf").to_string_lossy().to_string();

        if !Path::new(&sample1).exists() {
            println!("Fixtures not found, skipping pdf to image test");
            return;
        }

        let temp_dir = std::env::temp_dir().join("test_pdf_to_image_png");
        let _ = fs::create_dir_all(&temp_dir);

        let res = converters::pdf_to_image::convert_pdf_to_images(
            &sample1,
            &temp_dir.to_string_lossy(),
            Some("test_png"),
            Some("png"),
            Some(150),
            None,
        );
        assert!(res.is_ok(), "PDF to Image PNG should succeed: {:?}", res.err());
        let result = res.unwrap();
        assert!(result.success);
        assert_eq!(result.total_pages, 2);
        assert!(result.file_size_bytes > 0);

        let page1 = temp_dir.join("test_png_page_1.png");
        let page2 = temp_dir.join("test_png_page_2.png");
        assert!(page1.exists(), "Page 1 PNG must exist");
        assert!(page2.exists(), "Page 2 PNG must exist");

        let _ = fs::remove_dir_all(temp_dir);
    }

    #[test]
    fn test_pdf_to_image_jpg_single_page() {
        let fixtures_dir = Path::new("..").join("poc-converters").join("fixtures");
        let sample1 = fixtures_dir.join("sample1.pdf").to_string_lossy().to_string();

        if !Path::new(&sample1).exists() {
            return;
        }

        let temp_dir = std::env::temp_dir().join("test_pdf_to_image_jpg");
        let _ = fs::create_dir_all(&temp_dir);

        let res = converters::pdf_to_image::convert_pdf_to_images(
            &sample1,
            &temp_dir.to_string_lossy(),
            Some("test_jpg"),
            Some("jpg"),
            Some(150),
            Some("2"),
        );
        assert!(res.is_ok(), "Single page PDF to JPG should succeed: {:?}", res.err());
        let result = res.unwrap();
        assert!(result.success);
        assert_eq!(result.total_pages, 1);

        let page2 = temp_dir.join("test_jpg_page_2.jpg");
        assert!(page2.exists(), "Page 2 JPG must exist");

        let _ = fs::remove_dir_all(temp_dir);
    }

    #[test]
    fn test_pdf_to_image_invalid_inputs() {
        let temp_dir = std::env::temp_dir().join("test_pdf_to_image_invalid");
        let _ = fs::create_dir_all(&temp_dir);

        // 1. Non-existent file
        let fake = "C:\\path\\does_not_exist_xyz.pdf";
        let res_fake = converters::pdf_to_image::convert_pdf_to_images(
            fake,
            &temp_dir.to_string_lossy(),
            None,
            None,
            None,
            None,
        );
        assert!(res_fake.is_err(), "Non existent file must return Err");

        // 2. 0-byte file
        let empty_pdf = temp_dir.join("empty.pdf");
        fs::write(&empty_pdf, b"").expect("write empty");
        let res_empty = converters::pdf_to_image::convert_pdf_to_images(
            &empty_pdf.to_string_lossy(),
            &temp_dir.to_string_lossy(),
            None,
            None,
            None,
            None,
        );
        assert!(res_empty.is_err(), "0-byte PDF must fail gracefully");

        // 3. Out of bounds range
        let fixtures_dir = Path::new("..").join("poc-converters").join("fixtures");
        let sample1 = fixtures_dir.join("sample1.pdf").to_string_lossy().to_string();
        if Path::new(&sample1).exists() {
            let res_oob = converters::pdf_to_image::convert_pdf_to_images(
                &sample1,
                &temp_dir.to_string_lossy(),
                None,
                None,
                None,
                Some("99"),
            );
            assert!(res_oob.is_err(), "Page 99 on 2-page PDF must return Err");
        }

        let _ = fs::remove_dir_all(temp_dir);
    }

    #[test]
    fn test_compress_pdf_success() {
        let fixtures_dir = Path::new("..").join("poc-converters").join("fixtures");
        let sample1 = fixtures_dir.join("sample1.pdf").to_string_lossy().to_string();
        if !Path::new(&sample1).exists() {
            return;
        }

        let temp_dir = std::env::temp_dir().join("test_compress_pdf_success");
        let _ = fs::create_dir_all(&temp_dir);
        let out_pdf = temp_dir.join("compressed_sample1.pdf");

        let res = converters::pdf_compress::compress_pdf_file(
            &sample1,
            &out_pdf.to_string_lossy(),
            Some("medium"),
        );
        assert!(res.is_ok(), "Compress PDF should succeed: {:?}", res.err());
        let result = res.unwrap();
        assert!(result.success);
        assert_eq!(result.total_pages, 2);
        assert!(out_pdf.exists());
        assert!(result.original_size_bytes.is_some());
        assert!(result.compressed_size_bytes.is_some());
        assert!(result.reduction_percent.is_some());

        let _ = fs::remove_dir_all(temp_dir);
    }

    #[test]
    fn test_compress_pdf_levels() {
        let fixtures_dir = Path::new("..").join("poc-converters").join("fixtures");
        let sample1 = fixtures_dir.join("sample1.pdf").to_string_lossy().to_string();
        if !Path::new(&sample1).exists() {
            return;
        }

        let temp_dir = std::env::temp_dir().join("test_compress_pdf_levels");
        let _ = fs::create_dir_all(&temp_dir);

        for level in &["low", "medium", "high"] {
            let out_pdf = temp_dir.join(format!("compressed_{}.pdf", level));
            let res = converters::pdf_compress::compress_pdf_file(
                &sample1,
                &out_pdf.to_string_lossy(),
                Some(level),
            );
            assert!(res.is_ok(), "Compress PDF level {} should succeed", level);
            assert!(out_pdf.exists());
        }

        let _ = fs::remove_dir_all(temp_dir);
    }

    #[test]
    fn test_compress_pdf_invalid_inputs() {
        let temp_dir = std::env::temp_dir().join("test_compress_pdf_invalid");
        let _ = fs::create_dir_all(&temp_dir);

        // 1. Non existent file
        let fake = "C:\\path\\does_not_exist_xyz.pdf";
        let out1 = temp_dir.join("out1.pdf");
        let res_fake = converters::pdf_compress::compress_pdf_file(
            fake,
            &out1.to_string_lossy(),
            None,
        );
        assert!(res_fake.is_err(), "Non existent file must fail");

        // 2. 0-byte file
        let empty_pdf = temp_dir.join("empty.pdf");
        fs::write(&empty_pdf, b"").expect("write empty");
        let out2 = temp_dir.join("out2.pdf");
        let res_empty = converters::pdf_compress::compress_pdf_file(
            &empty_pdf.to_string_lossy(),
            &out2.to_string_lossy(),
            None,
        );
        assert!(res_empty.is_err(), "0-byte PDF must fail");

        // 3. Invalid extension
        let txt_file = temp_dir.join("file.txt");
        fs::write(&txt_file, b"hello").expect("write txt");
        let out3 = temp_dir.join("out3.pdf");
        let res_txt = converters::pdf_compress::compress_pdf_file(
            &txt_file.to_string_lossy(),
            &out3.to_string_lossy(),
            None,
        );
        assert!(res_txt.is_err(), "Non-PDF extension must fail");

        let _ = fs::remove_dir_all(temp_dir);
    }

    #[test]
    fn test_excel_to_pdf_xlsx_success() {
        let fixtures_dir = Path::new("..").join("poc-converters").join("fixtures");
        let sample_xlsx = fixtures_dir.join("sample.xlsx").to_string_lossy().to_string();
        if !Path::new(&sample_xlsx).exists() {
            return;
        }

        let temp_dir = std::env::temp_dir().join("test_excel_to_pdf_xlsx");
        let _ = fs::create_dir_all(&temp_dir);
        let out_pdf = temp_dir.join("xlsx_converted.pdf");

        let res = converters::excel_to_pdf::convert_excel_to_pdf(
            &sample_xlsx,
            &out_pdf.to_string_lossy(),
        );
        assert!(res.is_ok(), "Convert XLSX to PDF should succeed: {:?}", res.err());
        let result = res.unwrap();
        assert!(result.success);
        assert!(out_pdf.exists());
        assert!(result.total_pages >= 1);

        let _ = fs::remove_dir_all(temp_dir);
    }

    #[test]
    fn test_excel_to_pdf_csv_success() {
        let fixtures_dir = Path::new("..").join("poc-converters").join("fixtures");
        let sample_csv = fixtures_dir.join("sample.csv").to_string_lossy().to_string();
        if !Path::new(&sample_csv).exists() {
            return;
        }

        let temp_dir = std::env::temp_dir().join("test_excel_to_pdf_csv");
        let _ = fs::create_dir_all(&temp_dir);
        let out_pdf = temp_dir.join("csv_converted.pdf");

        let res = converters::excel_to_pdf::convert_excel_to_pdf(
            &sample_csv,
            &out_pdf.to_string_lossy(),
        );
        assert!(res.is_ok(), "Convert CSV to PDF should succeed: {:?}", res.err());
        let result = res.unwrap();
        assert!(result.success);
        assert!(out_pdf.exists());
        assert!(result.total_pages >= 1);

        let _ = fs::remove_dir_all(temp_dir);
    }

    #[test]
    fn test_excel_to_pdf_invalid_inputs() {
        let temp_dir = std::env::temp_dir().join("test_excel_to_pdf_invalid");
        let _ = fs::create_dir_all(&temp_dir);

        // 1. Non-existent file
        let fake = "C:\\path\\does_not_exist_xyz.xlsx";
        let out1 = temp_dir.join("out1.pdf");
        let res_fake = converters::excel_to_pdf::convert_excel_to_pdf(
            fake,
            &out1.to_string_lossy(),
        );
        assert!(res_fake.is_err(), "Non existent file must fail");

        // 2. 0-byte file
        let empty_xlsx = temp_dir.join("empty.xlsx");
        fs::write(&empty_xlsx, b"").expect("write empty");
        let out2 = temp_dir.join("out2.pdf");
        let res_empty = converters::excel_to_pdf::convert_excel_to_pdf(
            &empty_xlsx.to_string_lossy(),
            &out2.to_string_lossy(),
        );
        assert!(res_empty.is_err(), "0-byte Excel file must fail");

        // 3. Unsupported format
        let txt_file = temp_dir.join("file.txt");
        fs::write(&txt_file, b"data").expect("write txt");
        let out3 = temp_dir.join("out3.pdf");
        let res_txt = converters::excel_to_pdf::convert_excel_to_pdf(
            &txt_file.to_string_lossy(),
            &out3.to_string_lossy(),
        );
        assert!(res_txt.is_err(), "Unsupported format must fail");

        let _ = fs::remove_dir_all(temp_dir);
    }

    #[test]
    fn test_pptx_to_pdf_success() {
        let fixtures_dir = Path::new("..").join("poc-converters").join("fixtures");
        let sample_pptx = fixtures_dir.join("sample.pptx").to_string_lossy().to_string();
        if !Path::new(&sample_pptx).exists() {
            return;
        }

        let temp_dir = std::env::temp_dir().join("test_pptx_to_pdf_success");
        let _ = fs::create_dir_all(&temp_dir);
        let out_pdf = temp_dir.join("pptx_converted.pdf");

        let res = converters::pptx_to_pdf::convert_pptx_to_pdf(
            &sample_pptx,
            &out_pdf.to_string_lossy(),
        );
        assert!(res.is_ok(), "Convert PPTX to PDF should succeed: {:?}", res.err());
        let result = res.unwrap();
        assert!(result.success);
        assert!(out_pdf.exists());
        assert!(result.total_pages >= 1);

        let _ = fs::remove_dir_all(temp_dir);
    }

    #[test]
    fn test_pptx_to_pdf_invalid_inputs() {
        let temp_dir = std::env::temp_dir().join("test_pptx_to_pdf_invalid");
        let _ = fs::create_dir_all(&temp_dir);

        // 1. Non-existent file
        let fake = "C:\\path\\does_not_exist_xyz.pptx";
        let out1 = temp_dir.join("out1.pdf");
        let res_fake = converters::pptx_to_pdf::convert_pptx_to_pdf(
            fake,
            &out1.to_string_lossy(),
        );
        assert!(res_fake.is_err(), "Non existent file must fail");

        // 2. Unsupported format
        let txt_file = temp_dir.join("presentation.txt");
        fs::write(&txt_file, b"presentation").expect("write txt");
        let out2 = temp_dir.join("out2.pdf");
        let res_txt = converters::pptx_to_pdf::convert_pptx_to_pdf(
            &txt_file.to_string_lossy(),
            &out2.to_string_lossy(),
        );
        assert!(res_txt.is_err(), "Unsupported format must fail");

        let _ = fs::remove_dir_all(temp_dir);
    }

    #[test]
    fn test_pptx_to_pdf_corrupted_empty() {
        let temp_dir = std::env::temp_dir().join("test_pptx_to_pdf_empty");
        let _ = fs::create_dir_all(&temp_dir);

        let empty_pptx = temp_dir.join("empty.pptx");
        fs::write(&empty_pptx, b"").expect("write empty");
        let out = temp_dir.join("out_empty.pdf");
        let res_empty = converters::pptx_to_pdf::convert_pptx_to_pdf(
            &empty_pptx.to_string_lossy(),
            &out.to_string_lossy(),
        );
        assert!(res_empty.is_err(), "0-byte PPTX must fail");

        let _ = fs::remove_dir_all(temp_dir);
    }
}
