use lopdf::Document;
use rust_xlsxwriter::{Workbook, XlsxError};
use std::fs;
use std::path::Path;
use std::time::Instant;

fn split_table_row(line: &str) -> Vec<String> {
    let line = line.trim();
    if line.is_empty() {
        return Vec::new();
    }

    // 1. If tab-separated
    if line.contains('\t') {
        return line.split('\t').map(|s| s.trim().to_string()).filter(|s| !s.is_empty()).collect();
    }

    // 2. If pipe-separated (e.g. Markdown table: | col1 | col2 |)
    if line.contains('|') {
        let cols: Vec<String> = line
            .split('|')
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
            .collect();
        if cols.len() > 1 {
            return cols;
        }
    }

    // 3. If multiple spaces separated (2 or more spaces)
    let parts: Vec<String> = line
        .split("  ")
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .collect();

    if parts.len() > 1 {
        return parts;
    }

    // 4. Fallback: single column
    vec![line.to_string()]
}

pub fn convert_pdf_to_xlsx(input_path: &str, output_path: &str) -> Result<(u128, u64, usize), Box<dyn std::error::Error>> {
    let start = Instant::now();
    let in_file = Path::new(input_path);
    if !in_file.exists() {
        return Err(format!("File not found: {}", input_path).into());
    }

    let meta = fs::metadata(in_file)?;
    if meta.len() == 0 {
        return Err("0-byte PDF file".into());
    }

    let doc = Document::load(in_file)?;
    let pages = doc.get_pages();
    if pages.is_empty() {
        return Err("No pages found in PDF".into());
    }

    let mut workbook = Workbook::new();
    let total_pages = pages.len();

    let mut sorted_page_nums: Vec<u32> = pages.keys().copied().collect();
    sorted_page_nums.sort();

    for (sheet_idx, &page_num) in sorted_page_nums.iter().enumerate() {
        let sheet_name = if total_pages == 1 {
            "Sheet 1".to_string()
        } else {
            format!("Halaman {}", page_num)
        };

        let worksheet = workbook.add_worksheet().set_name(&sheet_name)?;

        let text = doc.extract_text(&[page_num]).unwrap_or_default();
        let mut row_idx: u32 = 0;

        for line in text.lines() {
            let cols = split_table_row(line);
            if cols.is_empty() {
                continue;
            }

            for (col_idx, val) in cols.iter().enumerate() {
                // Try parse integer
                if let Ok(num) = val.replace(',', "").parse::<i64>() {
                    let _ = worksheet.write_number(row_idx, col_idx as u16, num as f64);
                } else if let Ok(num) = val.replace(',', ".").parse::<f64>() {
                    let _ = worksheet.write_number(row_idx, col_idx as u16, num);
                } else {
                    let _ = worksheet.write_string(row_idx, col_idx as u16, val);
                }
            }

            row_idx += 1;
        }

        // If page has no text, write a placeholder
        if row_idx == 0 {
            let _ = worksheet.write_string(0, 0, format!("(Halaman {} kosong / berupa gambar)", page_num));
        }
    }

    workbook.save(output_path)?;

    let out_meta = fs::metadata(output_path)?;
    Ok((start.elapsed().as_millis(), out_meta.len(), total_pages))
}

fn main() {
    println!("=== Testing PoC PDF to Excel ===");

    let sample1 = "poc-converters/fixtures/sample1.pdf";
    let out1 = "poc-converters/output/sample1_converted.xlsx";
    if Path::new(sample1).exists() {
        match convert_pdf_to_xlsx(sample1, out1) {
            Ok((ms, size, pages)) => {
                println!("sample1.pdf -> XLSX SUCCESS: {} ms, {} bytes, {} pages", ms, size, pages);
            }
            Err(e) => println!("sample1.pdf -> XLSX FAILED: {}", e),
        }
    }

    let excel_pdf = "poc-converters/output/excel_test.pdf";
    let out2 = "poc-converters/output/excel_test_converted.xlsx";
    if Path::new(excel_pdf).exists() {
        match convert_pdf_to_xlsx(excel_pdf, out2) {
            Ok((ms, size, pages)) => {
                println!("excel_test.pdf -> XLSX SUCCESS: {} ms, {} bytes, {} pages", ms, size, pages);
            }
            Err(e) => println!("excel_test.pdf -> XLSX FAILED: {}", e),
        }
    }
}

