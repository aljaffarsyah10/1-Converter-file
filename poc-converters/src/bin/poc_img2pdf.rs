use lopdf::content::{Content, Operation};
use lopdf::{dictionary, Document, Object, Stream};
use std::fs::File;
use std::io::Read;
use std::time::Instant;

fn images_to_pdf(image_paths: &[&str], output_path: &str) -> Result<(usize, u128), Box<dyn std::error::Error>> {
    let start = Instant::now();
    let mut doc = Document::with_version("1.5");
    let pages_id = doc.new_object_id();
    let mut page_ids = Vec::new();

    for (idx, &img_path) in image_paths.iter().enumerate() {
        // Read image metadata
        let dyn_img = image::open(img_path)?;
        let (width, height) = (dyn_img.width(), dyn_img.height());

        // Standard 72 DPI coordinate space: 1 pixel = 1 pt (or fit to page)
        let pt_width = width as f64 * 72.0 / 96.0;
        let pt_height = height as f64 * 72.0 / 96.0;

        // Check if JPEG to embed raw bytes with DCTDecode
        let is_jpeg = img_path.to_lowercase().ends_with(".jpg") || img_path.to_lowercase().ends_with(".jpeg");
        
        let (img_stream_data, filter) = if is_jpeg {
            let mut file = File::open(img_path)?;
            let mut buffer = Vec::new();
            file.read_to_end(&mut buffer)?;
            (buffer, "DCTDecode")
        } else {
            let rgb = dyn_img.to_rgb8();
            // Encode raw RGB with FlateDecode
            let raw_data = rgb.into_raw();
            let mut encoder = flate2::write::ZlibEncoder::new(Vec::new(), flate2::Compression::default());
            use std::io::Write;
            encoder.write_all(&raw_data)?;
            (encoder.finish()?, "FlateDecode")
        };

        let image_stream_id = doc.new_object_id();
        let image_dict = dictionary! {
            "Type" => "XObject",
            "Subtype" => "Image",
            "Width" => Object::Integer(width as i64),
            "Height" => Object::Integer(height as i64),
            "ColorSpace" => "DeviceRGB",
            "BitsPerComponent" => Object::Integer(8),
            "Filter" => filter,
            "Length" => Object::Integer(img_stream_data.len() as i64),
        };
        let stream = Stream::new(image_dict, img_stream_data);
        doc.objects.insert(image_stream_id, Object::Stream(stream));

        // Create Content stream: "q width 0 0 height 0 0 cm /Im0 Do Q"
        let content_stream_id = doc.new_object_id();
        let img_name = format!("Im{}", idx);
        let content = Content {
            operations: vec![
                Operation::new("q", vec![]),
                Operation::new(
                    "cm",
                    vec![
                        Object::Real(pt_width as f32),
                        Object::Real(0.0),
                        Object::Real(0.0),
                        Object::Real(pt_height as f32),
                        Object::Real(0.0),
                        Object::Real(0.0),
                    ],
                ),
                Operation::new("Do", vec![Object::Name(img_name.as_bytes().to_vec())]),
                Operation::new("Q", vec![]),
            ],
        };
        let content_bytes = content.encode()?;
        let content_dict = dictionary! {
            "Length" => Object::Integer(content_bytes.len() as i64),
        };
        doc.objects.insert(content_stream_id, Object::Stream(Stream::new(content_dict, content_bytes)));

        // Create Page object
        let page_id = doc.new_object_id();
        let page_dict = dictionary! {
            "Type" => "Page",
            "Parent" => Object::Reference(pages_id),
            "MediaBox" => Object::Array(vec![
                Object::Real(0.0),
                Object::Real(0.0),
                Object::Real(pt_width as f32),
                Object::Real(pt_height as f32),
            ]),
            "Contents" => Object::Reference(content_stream_id),
            "Resources" => dictionary! {
                "XObject" => dictionary! {
                    img_name => Object::Reference(image_stream_id),
                },
            },
        };
        doc.objects.insert(page_id, Object::Dictionary(page_dict));
        page_ids.push(page_id);
    }

    // Pages Root
    let pages_dict = dictionary! {
        "Type" => "Pages",
        "Count" => Object::Integer(page_ids.len() as i64),
        "Kids" => Object::Array(page_ids.iter().map(|&id| Object::Reference(id)).collect()),
    };
    doc.objects.insert(pages_id, Object::Dictionary(pages_dict));

    // Catalog
    let catalog_id = doc.new_object_id();
    let catalog_dict = dictionary! {
        "Type" => "Catalog",
        "Pages" => Object::Reference(pages_id),
    };
    doc.objects.insert(catalog_id, Object::Dictionary(catalog_dict));

    doc.trailer.set("Root", Object::Reference(catalog_id));
    doc.save(output_path)?;

    let elapsed = start.elapsed().as_millis();
    Ok((page_ids.len(), elapsed))
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("=== PoC 3: Image to PDF (image + lopdf) ===");
    let inputs = [
        "fixtures/sample.png",
        "fixtures/sample.jpg",
    ];
    let output = "output/images_converted.pdf";

    println!("Converting images to PDF: {:?}", inputs);
    let (pages, duration) = images_to_pdf(&inputs, output)?;
    println!("SUCCESS! Output: {} (Pages: {}, Elapsed: {} ms)", output, pages, duration);

    // Verification
    let doc = Document::load(output)?;
    println!("Verification: Created PDF with {} pages successfully", doc.get_pages().len());
    Ok(())
}
