use lopdf::{Document, Object};
use std::collections::HashSet;
use std::fs;
use std::path::Path;
use std::time::Instant;

pub fn rotate_pdf(
    input_path: &str,
    output_path: &str,
    angle: i64,
    pages_to_rotate: Option<&[u32]>,
) -> Result<(u128, u64, usize), Box<dyn std::error::Error>> {
    let start = Instant::now();
    let in_file = Path::new(input_path);
    if !in_file.exists() {
        return Err(format!("File not found: {}", input_path).into());
    }

    let mut doc = Document::load(in_file)?;
    let pages = doc.get_pages();
    if pages.is_empty() {
        return Err("No pages found in PDF".into());
    }

    let filter_set: Option<HashSet<u32>> = pages_to_rotate.map(|p| p.iter().copied().collect());

    for (&page_num, &page_id) in pages.iter() {
        if let Some(ref set) = filter_set {
            if !set.contains(&page_num) {
                continue;
            }
        }

        let page_obj = doc.get_object_mut(page_id)?;
        let page_dict = page_obj.as_dict_mut()?;

        let current_rot = page_dict
            .get(b"Rotate")
            .and_then(|obj| obj.as_i64())
            .unwrap_or(0);

        let new_rot = (current_rot + angle).rem_euclid(360);
        page_dict.set("Rotate", Object::Integer(new_rot));
    }

    doc.save(output_path)?;
    let meta = fs::metadata(output_path)?;

    Ok((start.elapsed().as_millis(), meta.len(), pages.len()))
}

fn main() {
    println!("=== Testing PoC Rotate PDF ===");

    let sample1 = "poc-converters/fixtures/sample1.pdf";
    let out_rotated = "poc-converters/output/poc_rotated_90.pdf";

    if Path::new(sample1).exists() {
        match rotate_pdf(sample1, out_rotated, 90, None) {
            Ok((ms, size, pages)) => {
                println!("Rotate all 90 deg SUCCESS: {} ms, {} bytes, {} pages", ms, size, pages);

                // Verify by loading and checking /Rotate
                let doc = Document::load(out_rotated).unwrap();
                let p = doc.get_pages();
                for (num, id) in p {
                    let obj = doc.get_object(id).unwrap();
                    let dict = obj.as_dict().unwrap();
                    let rot = dict.get(b"Rotate").and_then(|v| v.as_i64()).unwrap_or(0);
                    println!("Page {} has Rotate: {} deg", num, rot);
                }
            }
            Err(e) => println!("Rotate FAILED: {}", e),
        }

        let out_page1_only = "poc-converters/output/poc_rotated_page1.pdf";
        match rotate_pdf(sample1, out_page1_only, 180, Some(&[1])) {
            Ok((ms, size, pages)) => {
                println!("Rotate page 1 180 deg SUCCESS: {} ms, {} bytes, {} pages", ms, size, pages);
                let doc = Document::load(out_page1_only).unwrap();
                let p = doc.get_pages();
                for (num, id) in p {
                    let obj = doc.get_object(id).unwrap();
                    let dict = obj.as_dict().unwrap();
                    let rot = dict.get(b"Rotate").and_then(|v| v.as_i64()).unwrap_or(0);
                    println!("Page {} has Rotate: {} deg (expected: p1=180, p2=0)", num, rot);
                }
            }
            Err(e) => println!("Rotate page 1 FAILED: {}", e),
        }
    }
}
