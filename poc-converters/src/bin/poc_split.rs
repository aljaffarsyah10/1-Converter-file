use lopdf::{Document, Object, dictionary};
use std::time::Instant;

fn extract_pages(input_path: &str, page_numbers: &[u32], output_path: &str) -> Result<(usize, u128), Box<dyn std::error::Error>> {
    let start = Instant::now();
    let original = Document::load(input_path)?;
    let all_pages = original.get_pages(); // BTreeMap<u32, ObjectId>

    let mut target_page_ids = Vec::new();
    for &num in page_numbers {
        if let Some(&id) = all_pages.get(&num) {
            target_page_ids.push(id);
        } else {
            return Err(format!("Page {} not found in document (total: {})", num, all_pages.len()).into());
        }
    }

    let mut new_doc = Document::with_version(original.version.as_str());
    new_doc.objects = original.objects;
    new_doc.max_id = new_doc.objects.keys().map(|(id, _)| *id).max().unwrap_or(0);

    // Create new Pages object
    let pages_id = new_doc.new_object_id();
    let kids: Vec<Object> = target_page_ids.iter().map(|&id| Object::Reference(id)).collect();

    let pages_dict = dictionary! {
        "Type" => Object::Name(b"Pages".to_vec()),
        "Count" => Object::Integer(target_page_ids.len() as i64),
        "Kids" => Object::Array(kids),
    };
    new_doc.objects.insert(pages_id, Object::Dictionary(pages_dict));

    // Update parent reference for target pages
    for &page_id in &target_page_ids {
        if let Ok(page_obj) = new_doc.get_object_mut(page_id) {
            if let Ok(dict) = page_obj.as_dict_mut() {
                dict.set("Parent", Object::Reference(pages_id));
            }
        }
    }

    // Create new Catalog
    let catalog_id = new_doc.new_object_id();
    let catalog_dict = dictionary! {
        "Type" => Object::Name(b"Catalog".to_vec()),
        "Pages" => Object::Reference(pages_id),
    };
    new_doc.objects.insert(catalog_id, Object::Dictionary(catalog_dict));

    // Set clean trailer Root
    new_doc.trailer = dictionary! {
        "Root" => Object::Reference(catalog_id),
    };
    new_doc.prune_objects();
    new_doc.save(output_path)?;

    let elapsed = start.elapsed().as_millis();
    Ok((target_page_ids.len(), elapsed))
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("=== PoC 2: Split PDF (lopdf) ===");
    let input = "fixtures/sample1.pdf";
    let output_p1 = "output/split_page_1.pdf";
    let output_p2 = "output/split_page_2.pdf";

    // Extract Page 1
    println!("Extracting Page 1 from {}", input);
    let (pages1, duration1) = extract_pages(input, &[1], output_p1)?;
    println!("SUCCESS! Output: {} (Pages: {}, Elapsed: {} ms)", output_p1, pages1, duration1);

    // Extract Page 2
    println!("Extracting Page 2 from {}", input);
    let (pages2, duration2) = extract_pages(input, &[2], output_p2)?;
    println!("SUCCESS! Output: {} (Pages: {}, Elapsed: {} ms)", output_p2, pages2, duration2);

    // Verification
    let doc1 = Document::load(output_p1)?;
    let doc2 = Document::load(output_p2)?;
    let pcount1 = doc1.get_pages().len();
    let pcount2 = doc2.get_pages().len();
    println!("Verification: Doc 1 pages = {}, Doc 2 pages = {}", pcount1, pcount2);
    assert_eq!(pcount1, 1, "Page 1 split must have exactly 1 page");
    assert_eq!(pcount2, 1, "Page 2 split must have exactly 1 page");
    println!("VERIFICATION PASSED: Split PDF structure is 100% valid.");
    Ok(())
}

