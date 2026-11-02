use docx_rs::*;
use std::fs::File;
use std::path::Path;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let pdf_path = Path::new("fixtures/sample1.pdf");
    let out_path = Path::new("output/poc_output_sample1.docx");
    
    std::fs::create_dir_all("output")?;

    println!("Loading PDF from {:?}", pdf_path);
    let doc = lopdf::Document::load(pdf_path)?;
    let pages = doc.get_pages();
    println!("PDF loaded successfully. Total pages: {}", pages.len());

    let mut docx = Docx::new();

    let mut page_indices: Vec<u32> = pages.keys().copied().collect();
    page_indices.sort();

    for (i, &page_num) in page_indices.iter().enumerate() {
        if i > 0 {
            // Add page break between pages
            docx = docx.add_paragraph(
                Paragraph::new().add_run(Run::new().add_break(BreakType::Page)),
            );
        }

        match doc.extract_text(&[page_num]) {
            Ok(text) => {
                println!("Page {}: extracted {} chars", page_num, text.len());
                let lines: Vec<&str> = text.lines().collect();
                for line in lines {
                    let trimmed = line.trim();
                    if !trimmed.is_empty() {
                        docx = docx.add_paragraph(
                            Paragraph::new().add_run(Run::new().add_text(trimmed)),
                        );
                    }
                }
            }
            Err(e) => {
                eprintln!("Warning: could not extract text from page {}: {}", page_num, e);
            }
        }
    }

    let file = File::create(out_path)?;
    docx.build().pack(file)?;

    let metadata = std::fs::metadata(out_path)?;
    println!(
        "SUCCESS! Generated DOCX at {:?}, size: {} bytes",
        out_path,
        metadata.len()
    );

    Ok(())
}
