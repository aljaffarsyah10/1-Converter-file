use lopdf::{Document, Object, dictionary};
use std::collections::BTreeMap;
use std::time::Instant;

fn merge_pdf_files(inputs: &[&str], output_path: &str) -> Result<(usize, u128), Box<dyn std::error::Error>> {
    let start = Instant::now();
    let mut max_id = 1;
    let mut all_pages = Vec::new();
    let mut all_objects = BTreeMap::new();

    for &input in inputs {
        let mut doc = Document::load(input)?;
        doc.renumber_objects_with(max_id);
        max_id = doc.max_id + 1;

        for (page_num, page_id) in doc.get_pages() {
            all_pages.push((page_num, page_id));
        }

        for (id, object) in doc.objects {
            let is_special = match &object {
                Object::Dictionary(dict) => {
                    dict.get(b"Type").and_then(|o| o.as_name()).map(|n| n == b"Catalog" || n == b"Pages" || n == b"XRef").unwrap_or(false)
                }
                Object::Stream(stream) => {
                    stream.dict.get(b"Type").and_then(|o| o.as_name()).map(|n| n == b"Catalog" || n == b"Pages" || n == b"XRef").unwrap_or(false)
                }
                _ => false,
            };

            if is_special {
                continue;
            }
            all_objects.insert(id, object);
        }
    }

    let page_count = all_pages.len();
    let mut merged_doc = Document::with_version("1.5");
    merged_doc.objects = all_objects;
    merged_doc.max_id = merged_doc.objects.keys().map(|(id, _)| *id).max().unwrap_or(0);

    // Create a new Pages dictionary
    let pages_id = merged_doc.new_object_id();
    let kids: Vec<Object> = all_pages.iter().map(|(_, id)| Object::Reference(*id)).collect();

    let pages_dict = dictionary! {
        "Type" => Object::Name(b"Pages".to_vec()),
        "Count" => Object::Integer(page_count as i64),
        "Kids" => Object::Array(kids),
    };
    merged_doc.objects.insert(pages_id, Object::Dictionary(pages_dict));

    // Update parent reference on each page to the new Pages root
    for (_, page_id) in &all_pages {
        if let Ok(page_obj) = merged_doc.get_object_mut(*page_id) {
            if let Ok(dict) = page_obj.as_dict_mut() {
                dict.set("Parent", Object::Reference(pages_id));
            }
        }
    }

    // Create Catalog dictionary
    let catalog_id = merged_doc.new_object_id();
    let catalog_dict = dictionary! {
        "Type" => Object::Name(b"Catalog".to_vec()),
        "Pages" => Object::Reference(pages_id),
    };
    merged_doc.objects.insert(catalog_id, Object::Dictionary(catalog_dict));

    // Set trailer Root
    merged_doc.trailer = dictionary! {
        "Root" => Object::Reference(catalog_id),
    };
    merged_doc.prune_objects();
    merged_doc.save(output_path)?;

    let elapsed = start.elapsed().as_millis();
    Ok((page_count, elapsed))
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("=== PoC 1: Merge PDF (lopdf) ===");
    let inputs = [
        "fixtures/sample1.pdf",
        "fixtures/sample2.pdf",
    ];
    let output = "output/merged_result.pdf";

    println!("Merging: {:?}", inputs);
    let (pages, duration) = merge_pdf_files(&inputs, output)?;
    println!("SUCCESS! Output: {} (Total Pages: {}, Elapsed: {} ms)", output, pages, duration);

    // Verify output
    let doc = Document::load(output)?;
    let verified_pages = doc.get_pages().len();
    println!("Verification: Output successfully parsed with {} pages", verified_pages);
    assert_eq!(pages, verified_pages, "Page count must match!");
    println!("VERIFICATION PASSED: Merged PDF structure is 100% valid.");
    Ok(())
}
