use crate::errors::AppError;
use crate::models::ConversionResult;
use lopdf::content::{Content, Operation};
use lopdf::{dictionary, Document, Object, Stream};
use std::fs::{self, File};
use std::io::{Read, Write};
use std::path::Path;
use std::time::Instant;

pub fn convert_images_to_pdf(
    input_paths: &[String],
    output_path: &str,
    orientation: Option<&str>,
    margin_str: Option<&str>,
) -> Result<ConversionResult, AppError> {
    let start = Instant::now();

    if input_paths.is_empty() {
        return Err(AppError::ExecutionError("Daftar gambar input kosong".into()));
    }

    let margin_pts = match margin_str.unwrap_or("none") {
        "small" => 18.0f64,
        "normal" => 36.0f64,
        _ => 0.0f64,
    };

    let mut doc = Document::with_version("1.5");
    let pages_id = doc.new_object_id();
    let mut page_ids = Vec::new();

    for (idx, img_path) in input_paths.iter().enumerate() {
        let p = Path::new(img_path);
        if !p.exists() {
            return Err(AppError::FileNotFound(img_path.to_string()));
        }

        let dyn_img = image::open(p)?;
        let (raw_w, raw_h) = (dyn_img.width() as f64, dyn_img.height() as f64);

        if raw_w == 0.0 || raw_h == 0.0 {
            return Err(AppError::CorruptedFile(format!("Gambar berdimensi 0: {}", img_path)));
        }

        // Coordinate space: 1 px = 0.75 pt (at 96 DPI base)
        let base_pt_w = raw_w * 72.0 / 96.0;
        let base_pt_h = raw_h * 72.0 / 96.0;

        // Determine page box
        let (page_w, page_h) = match orientation.unwrap_or("auto") {
            "portrait" => {
                let w = base_pt_w.min(base_pt_h);
                let h = base_pt_w.max(base_pt_h);
                (w + margin_pts * 2.0, h + margin_pts * 2.0)
            }
            "landscape" => {
                let w = base_pt_w.max(base_pt_h);
                let h = base_pt_w.min(base_pt_h);
                (w + margin_pts * 2.0, h + margin_pts * 2.0)
            }
            _ => (base_pt_w + margin_pts * 2.0, base_pt_h + margin_pts * 2.0),
        };

        // Proportional scaling and centering
        let printable_w = (page_w - margin_pts * 2.0).max(1.0);
        let printable_h = (page_h - margin_pts * 2.0).max(1.0);
        let scale = (printable_w / base_pt_w).min(printable_h / base_pt_h);
        let render_w = base_pt_w * scale;
        let render_h = base_pt_h * scale;
        let offset_x = margin_pts + (printable_w - render_w) / 2.0;
        let offset_y = margin_pts + (printable_h - render_h) / 2.0;

        let is_jpeg = img_path.to_lowercase().ends_with(".jpg") || img_path.to_lowercase().ends_with(".jpeg");

        let (img_stream_data, filter) = if is_jpeg {
            let mut file = File::open(p)?;
            let mut buffer = Vec::new();
            file.read_to_end(&mut buffer)?;
            (buffer, "DCTDecode")
        } else {
            let rgb = dyn_img.to_rgb8();
            let raw_bytes = rgb.into_raw();
            let mut encoder = flate2::write::ZlibEncoder::new(Vec::new(), flate2::Compression::default());
            encoder.write_all(&raw_bytes)?;
            (encoder.finish()?, "FlateDecode")
        };

        let image_stream_id = doc.new_object_id();
        let image_dict = dictionary! {
            "Type" => Object::Name(b"XObject".to_vec()),
            "Subtype" => Object::Name(b"Image".to_vec()),
            "Width" => Object::Integer(raw_w as i64),
            "Height" => Object::Integer(raw_h as i64),
            "ColorSpace" => Object::Name(b"DeviceRGB".to_vec()),
            "BitsPerComponent" => Object::Integer(8),
            "Filter" => Object::Name(filter.as_bytes().to_vec()),
            "Length" => Object::Integer(img_stream_data.len() as i64),
        };
        let stream = Stream::new(image_dict, img_stream_data);
        doc.objects.insert(image_stream_id, Object::Stream(stream));

        let img_name = format!("Im{}", idx);
        let content_stream_id = doc.new_object_id();
        let content = Content {
            operations: vec![
                Operation::new("q", vec![]),
                Operation::new(
                    "cm",
                    vec![
                        Object::Real(render_w as f32),
                        Object::Real(0.0),
                        Object::Real(0.0),
                        Object::Real(render_h as f32),
                        Object::Real(offset_x as f32),
                        Object::Real(offset_y as f32),
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

        let page_id = doc.new_object_id();
        let page_dict = dictionary! {
            "Type" => Object::Name(b"Page".to_vec()),
            "Parent" => Object::Reference(pages_id),
            "MediaBox" => Object::Array(vec![
                Object::Real(0.0),
                Object::Real(0.0),
                Object::Real(page_w as f32),
                Object::Real(page_h as f32),
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

    let page_count = page_ids.len();
    let pages_dict = dictionary! {
        "Type" => Object::Name(b"Pages".to_vec()),
        "Count" => Object::Integer(page_count as i64),
        "Kids" => Object::Array(page_ids.iter().map(|&id| Object::Reference(id)).collect()),
    };
    doc.objects.insert(pages_id, Object::Dictionary(pages_dict));

    let catalog_id = doc.new_object_id();
    let catalog_dict = dictionary! {
        "Type" => Object::Name(b"Catalog".to_vec()),
        "Pages" => Object::Reference(pages_id),
    };
    doc.objects.insert(catalog_id, Object::Dictionary(catalog_dict));

    doc.trailer = dictionary! {
        "Root" => Object::Reference(catalog_id),
    };

    if let Some(parent) = Path::new(output_path).parent() {
        if !parent.exists() {
            fs::create_dir_all(parent)?;
        }
    }

    doc.save(output_path)?;
    let metadata = fs::metadata(output_path)?;

    Ok(ConversionResult {
        success: true,
        output_path: output_path.to_string(),
        duration_ms: start.elapsed().as_millis(),
        file_size_bytes: metadata.len(),
        total_pages: page_count,
        ..Default::default()
    })
}

