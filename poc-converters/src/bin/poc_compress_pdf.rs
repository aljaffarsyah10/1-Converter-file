use lopdf::{Document, Object};
use std::fs;
use std::io::Cursor;

fn compress_pdf_file(
    input_path: &str,
    output_path: &str,
    level: &str,
) -> Result<(u64, u64, f64), Box<dyn std::error::Error>> {
    let in_meta = fs::metadata(input_path)?;
    let original_size = in_meta.len();

    let mut doc = Document::load(input_path)?;

    // 1. Prune unused objects
    doc.prune_objects();

    // 2. Compress streams with Flate
    doc.compress();

    // Compression quality & max dimension based on level
    let (jpeg_quality, max_dim): (u8, u32) = match level.to_lowercase().as_str() {
        "low" => (80, 2400),
        "high" => (40, 1000),
        _ => (60, 1600), // "medium"
    };

    // 3. Re-encode embedded image streams
    for (_id, object) in doc.objects.iter_mut() {
        if let Object::Stream(ref mut stream) = object {
            let is_image = stream.dict.get(b"Subtype").map_or(false, |val| {
                val.as_name().map_or(false, |name| name == b"Image")
            });

            if is_image {
                if let Ok(decompressed) = stream.decompressed_content() {
                    if let Ok(mut dyn_img) = image::load_from_memory(&decompressed) {
                        // Check if downsample needed
                        let (w, h) = (dyn_img.width(), dyn_img.height());
                        if w > max_dim || h > max_dim {
                            let ratio = (max_dim as f32) / (w.max(h) as f32);
                            let new_w = ((w as f32) * ratio) as u32;
                            let new_h = ((h as f32) * ratio) as u32;
                            dyn_img = dyn_img.resize(new_w, new_h, image::imageops::FilterType::Lanczos3);
                        }

                        let mut compressed_buf = Cursor::new(Vec::new());
                        let mut encoder =
                            image::codecs::jpeg::JpegEncoder::new_with_quality(&mut compressed_buf, jpeg_quality);
                        if encoder.encode_image(&dyn_img).is_ok() {
                            let new_bytes = compressed_buf.into_inner();
                            if new_bytes.len() < stream.content.len() {
                                stream.set_content(new_bytes);
                                stream.dict.set("Filter", Object::Name(b"DCTDecode".to_vec()));
                                stream.dict.set("Width", Object::Integer(dyn_img.width() as i64));
                                stream.dict.set("Height", Object::Integer(dyn_img.height() as i64));
                            }
                        }
                    }
                }
            }
        }
    }

    doc.save(output_path)?;
    let out_meta = fs::metadata(output_path)?;
    let compressed_size = out_meta.len();
    let reduction_percent = if original_size > 0 {
        ((original_size as f64 - compressed_size as f64) / original_size as f64) * 100.0
    } else {
        0.0
    };

    Ok((original_size, compressed_size, reduction_percent))
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let input = "fixtures/sample1.pdf";
    let output = "output/test_compressed_levels.pdf";
    fs::create_dir_all("output")?;

    for level in ["low", "medium", "high"] {
        let (orig, comp, pct) = compress_pdf_file(input, output, level)?;
        println!(
            "Level '{}': {} -> {} bytes ({:.2}% reduction)",
            level, orig, comp, pct
        );
    }

    Ok(())
}
