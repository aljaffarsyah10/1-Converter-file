use lopdf::content::{Content, Operation};
use lopdf::{dictionary, Document, Object, Stream};
use std::fs;
use std::path::Path;

fn get_page_dimensions(doc: &Document, page_id: lopdf::ObjectId) -> (f64, f64) {
    let page_obj = doc.get_object(page_id).and_then(|o| o.as_dict());
    if let Ok(dict) = page_obj {
        if let Ok(box_arr) = dict.get(b"MediaBox").and_then(|o| o.as_array()) {
            if box_arr.len() == 4 {
                let w = box_arr[2]
                    .as_float()
                    .map(|v| v as f64)
                    .or_else(|_| box_arr[2].as_i64().map(|v| v as f64))
                    .unwrap_or(595.28);
                let h = box_arr[3]
                    .as_float()
                    .map(|v| v as f64)
                    .or_else(|_| box_arr[3].as_i64().map(|v| v as f64))
                    .unwrap_or(841.89);
                return (w, h);
            }
        }
    }
    (595.28, 841.89) // Default A4
}

fn escape_pdf_string(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    for c in s.chars() {
        match c {
            '(' => out.push_str("\\("),
            ')' => out.push_str("\\)"),
            '\\' => out.push_str("\\\\"),
            '\r' => out.push_str("\\r"),
            '\n' => out.push_str("\\n"),
            _ => out.push(c),
        }
    }
    out
}

pub fn add_watermark(
    input_path: &str,
    output_path: &str,
    text: &str,
    font_size: f64,
    opacity: f64,
    diagonal: bool,
    color_rgb: (f64, f64, f64),
) -> Result<(), Box<dyn std::error::Error>> {
    let mut doc = Document::load(input_path)?;

    // 1. Create standard Type1 Font object (/Helvetica-Bold)
    let font_dict = dictionary! {
        "Type" => "Font",
        "Subtype" => "Type1",
        "BaseFont" => "Helvetica-Bold",
        "Encoding" => "WinAnsiEncoding",
    };
    let font_id = doc.add_object(Object::Dictionary(font_dict));

    // 2. Create ExtGState object for opacity / transparency
    let extgstate_dict = dictionary! {
        "Type" => "ExtGState",
        "ca" => opacity,
        "CA" => opacity,
    };
    let extgstate_id = doc.add_object(Object::Dictionary(extgstate_dict));

    let pages = doc.get_pages();
    for (_page_num, &page_id) in pages.iter() {
        let (page_w, page_h) = get_page_dimensions(&doc, page_id);

        // Approximate text length in points (approx 0.55 * font_size per char)
        let text_width = text.len() as f64 * font_size * 0.55;

        // Position: center or diagonal
        let (a, b, c, d, x, y) = if diagonal {
            let angle_rad = 45.0_f64.to_radians();
            let cos = angle_rad.cos();
            let sin = angle_rad.sin();
            // Center of page
            let cx = page_w / 2.0;
            let cy = page_h / 2.0;
            // Center text on cx, cy
            let x0 = cx - (text_width / 2.0) * cos;
            let y0 = cy - (text_width / 2.0) * sin;
            (cos, sin, -sin, cos, x0, y0)
        } else {
            // Horizontal center
            let x0 = (page_w - text_width) / 2.0;
            let y0 = page_h / 2.0;
            (1.0, 0.0, 0.0, 1.0, x0, y0)
        };

        let escaped_text = escape_pdf_string(text);
        let (r, g, b_col) = color_rgb;

        // Construct PDF content stream
        let stream_content = format!(
            "q\n/GS_WM gs\n{r:.2} {g:.2} {b:.2} rg\n{a:.4} {b_mat:.4} {c:.4} {d:.4} {x:.2} {y:.2} cm\nBT\n/F_WM {fs:.1} Tf\n({txt}) Tj\nET\nQ\n",
            r = r,
            g = g,
            b = b_col,
            a = a,
            b_mat = b,
            c = c,
            d = d,
            x = x,
            y = y,
            fs = font_size,
            txt = escaped_text
        );

        let wm_stream = Stream::new(dictionary!(), stream_content.into_bytes());
        let wm_stream_id = doc.add_object(Object::Stream(wm_stream));

        // Update Page Resources with /Font /F_WM and /ExtGState /GS_WM
        if let Ok(page_obj) = doc.get_object_mut(page_id) {
            if let Ok(page_dict) = page_obj.as_dict_mut() {
                // Ensure /Resources exists
                if !page_dict.has(b"Resources") {
                    page_dict.set("Resources", Object::Dictionary(dictionary!()));
                }

                // If Resources is a dictionary or a reference
                let resources_dict = match page_dict.get_mut(b"Resources").unwrap() {
                    Object::Dictionary(ref mut dict) => dict,
                    _ => continue,
                };

                // Add Font /F_WM
                if !resources_dict.has(b"Font") {
                    resources_dict.set("Font", Object::Dictionary(dictionary!()));
                }
                if let Ok(font_sub) = resources_dict.get_mut(b"Font").and_then(|o| o.as_dict_mut()) {
                    font_sub.set("F_WM", Object::Reference(font_id));
                }

                // Add ExtGState /GS_WM
                if !resources_dict.has(b"ExtGState") {
                    resources_dict.set("ExtGState", Object::Dictionary(dictionary!()));
                }
                if let Ok(gs_sub) = resources_dict.get_mut(b"ExtGState").and_then(|o| o.as_dict_mut()) {
                    gs_sub.set("GS_WM", Object::Reference(extgstate_id));
                }

                // Append wm_stream_id to /Contents
                if let Ok(contents) = page_dict.get_mut(b"Contents") {
                    match contents {
                        Object::Reference(orig_ref) => {
                            let new_arr = vec![Object::Reference(*orig_ref), Object::Reference(wm_stream_id)];
                            *contents = Object::Array(new_arr);
                        }
                        Object::Array(ref mut arr) => {
                            arr.push(Object::Reference(wm_stream_id));
                        }
                        _ => {}
                    }
                } else {
                    page_dict.set("Contents", Object::Reference(wm_stream_id));
                }
            }
        }
    }

    doc.save(output_path)?;
    Ok(())
}

fn main() {
    println!("=== Testing PDF Watermark PoC ===");
    let input = "poc-converters/fixtures/sample1.pdf";
    let output = "poc-converters/output/poc_watermarked.pdf";

    add_watermark(input, output, "CONFIDENTIAL", 54.0, 0.25, true, (0.8, 0.2, 0.2)).expect("watermark");
    println!("SUCCESS: Watermark applied to {}", output);

    // Verify output exists and is readable
    let doc = Document::load(output).expect("load watermarked");
    let text = doc.extract_text(&[1]).unwrap();
    println!("Extracted text from page 1:\n{}", text);
    assert!(text.contains("CONFIDENTIAL"), "Extracted text must contain watermark CONFIDENTIAL");
    println!("VERIFIED: Page 1 contains watermark text!");
}
