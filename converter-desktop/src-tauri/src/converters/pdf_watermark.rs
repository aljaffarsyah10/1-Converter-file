use crate::errors::AppError;
use crate::models::ConversionResult;
use lopdf::{dictionary, Document, Object, ObjectId, Stream};
use std::fs;
use std::path::Path;
use std::time::Instant;

fn get_page_dimensions(doc: &Document, page_id: ObjectId) -> (f64, f64) {
    if let Ok(page_obj) = doc.get_object(page_id).and_then(|o| o.as_dict()) {
        if let Ok(box_arr) = page_obj.get(b"MediaBox").and_then(|o| o.as_array()) {
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

pub fn parse_hex_color(hex: Option<&str>) -> (f64, f64, f64) {
    if let Some(h) = hex {
        let trimmed = h.trim().trim_start_matches('#');
        if trimmed.len() == 6 {
            if let (Ok(r), Ok(g), Ok(b)) = (
                u8::from_str_radix(&trimmed[0..2], 16),
                u8::from_str_radix(&trimmed[2..4], 16),
                u8::from_str_radix(&trimmed[4..6], 16),
            ) {
                return (r as f64 / 255.0, g as f64 / 255.0, b as f64 / 255.0);
            }
        }
    }
    (0.5, 0.5, 0.5) // Default gray
}

pub fn add_watermark_to_pdf(
    input_path: &str,
    output_path: &str,
    text: &str,
    font_size: Option<f64>,
    opacity: Option<f64>,
    position: Option<&str>,
    color: Option<&str>,
) -> Result<ConversionResult, AppError> {
    let start = Instant::now();
    let in_file = Path::new(input_path);
    if !in_file.exists() {
        return Err(AppError::FileNotFound(input_path.to_string()));
    }

    let ext = in_file
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();
    if ext != "pdf" {
        return Err(AppError::InvalidFileFormat {
            expected: ".pdf".into(),
            actual: format!(".{}", ext),
        });
    }

    let in_meta = fs::metadata(in_file)?;
    if in_meta.len() == 0 {
        return Err(AppError::CorruptedFile("Berkas PDF berukuran 0 byte".into()));
    }

    if text.trim().is_empty() {
        return Err(AppError::ExecutionError(
            "Teks watermark tidak boleh kosong".into(),
        ));
    }

    let mut doc = Document::load(in_file).map_err(|e| {
        AppError::CorruptedFile(format!("Gagal membaca berkas PDF: {}", e))
    })?;

    let pages = doc.get_pages();
    if pages.is_empty() {
        return Err(AppError::CorruptedFile(
            "Dokumen PDF tidak memiliki halaman yang valid".into(),
        ));
    }

    let total_pages = pages.len();
    let fs_val = font_size.unwrap_or(54.0).clamp(12.0, 144.0);
    let op_val = opacity.unwrap_or(0.25).clamp(0.01, 1.0);
    let is_diagonal = position.map(|p| p.to_lowercase() == "diagonal").unwrap_or(true);
    let (r_col, g_col, b_col) = parse_hex_color(color);

    // 1. Add standard Helvetica-Bold Font Object
    let font_dict = dictionary! {
        "Type" => "Font",
        "Subtype" => "Type1",
        "BaseFont" => "Helvetica-Bold",
        "Encoding" => "WinAnsiEncoding",
    };
    let font_id = doc.add_object(Object::Dictionary(font_dict));

    // 2. Add ExtGState Object for transparency/opacity
    let extgstate_dict = dictionary! {
        "Type" => "ExtGState",
        "ca" => op_val,
        "CA" => op_val,
    };
    let extgstate_id = doc.add_object(Object::Dictionary(extgstate_dict));

    let escaped_text = escape_pdf_string(text);

    // Iterate all pages and apply watermark stream
    for (_page_num, &page_id) in pages.iter() {
        let (page_w, page_h) = get_page_dimensions(&doc, page_id);
        let text_width = text.len() as f64 * fs_val * 0.55;

        let (a, b, c, d, x, y) = if is_diagonal {
            let angle_rad = 45.0_f64.to_radians();
            let cos = angle_rad.cos();
            let sin = angle_rad.sin();
            let cx = page_w / 2.0;
            let cy = page_h / 2.0;
            let x0 = cx - (text_width / 2.0) * cos;
            let y0 = cy - (text_width / 2.0) * sin;
            (cos, sin, -sin, cos, x0, y0)
        } else {
            let x0 = (page_w - text_width) / 2.0;
            let y0 = page_h / 2.0;
            (1.0, 0.0, 0.0, 1.0, x0, y0)
        };

        let stream_content = format!(
            "q\n/GS_WM gs\n{r:.2} {g:.2} {b:.2} rg\n{a:.4} {b_mat:.4} {c:.4} {d:.4} {x:.2} {y:.2} cm\nBT\n/F_WM {fs:.1} Tf\n({txt}) Tj\nET\nQ\n",
            r = r_col,
            g = g_col,
            b = b_col,
            a = a,
            b_mat = b,
            c = c,
            d = d,
            x = x,
            y = y,
            fs = fs_val,
            txt = escaped_text
        );

        let wm_stream = Stream::new(dictionary!(), stream_content.into_bytes());
        let wm_stream_id = doc.add_object(Object::Stream(wm_stream));

        // Inject Font and ExtGState into Page Resources
        let res_obj_id = if let Ok(p_dict) = doc.get_object(page_id).and_then(|o| o.as_dict()) {
            match p_dict.get(b"Resources") {
                Ok(Object::Reference(id)) => Some(*id),
                _ => None,
            }
        } else {
            None
        };

        if let Some(res_id) = res_obj_id {
            if let Ok(res_obj) = doc.get_object_mut(res_id) {
                if let Ok(res_dict) = res_obj.as_dict_mut() {
                    if !res_dict.has(b"Font") {
                        res_dict.set("Font", Object::Dictionary(dictionary!()));
                    }
                    if let Ok(font_sub) = res_dict.get_mut(b"Font").and_then(|o| o.as_dict_mut()) {
                        font_sub.set("F_WM", Object::Reference(font_id));
                    }
                    if !res_dict.has(b"ExtGState") {
                        res_dict.set("ExtGState", Object::Dictionary(dictionary!()));
                    }
                    if let Ok(gs_sub) = res_dict.get_mut(b"ExtGState").and_then(|o| o.as_dict_mut()) {
                        gs_sub.set("GS_WM", Object::Reference(extgstate_id));
                    }
                }
            }
        } else if let Ok(page_obj) = doc.get_object_mut(page_id) {
            if let Ok(page_dict) = page_obj.as_dict_mut() {
                if !page_dict.has(b"Resources") {
                    page_dict.set("Resources", Object::Dictionary(dictionary!()));
                }
                if let Ok(res_dict) = page_dict.get_mut(b"Resources").and_then(|o| o.as_dict_mut()) {
                    if !res_dict.has(b"Font") {
                        res_dict.set("Font", Object::Dictionary(dictionary!()));
                    }
                    if let Ok(font_sub) = res_dict.get_mut(b"Font").and_then(|o| o.as_dict_mut()) {
                        font_sub.set("F_WM", Object::Reference(font_id));
                    }
                    if !res_dict.has(b"ExtGState") {
                        res_dict.set("ExtGState", Object::Dictionary(dictionary!()));
                    }
                    if let Ok(gs_sub) = res_dict.get_mut(b"ExtGState").and_then(|o| o.as_dict_mut()) {
                        gs_sub.set("GS_WM", Object::Reference(extgstate_id));
                    }
                }
            }
        }

        // Attach wm_stream_id to Page Contents
        if let Ok(page_obj) = doc.get_object_mut(page_id) {
            if let Ok(page_dict) = page_obj.as_dict_mut() {
                if let Ok(contents) = page_dict.get_mut(b"Contents") {
                    match contents {
                        Object::Reference(orig_ref) => {
                            let new_arr = vec![Object::Reference(*orig_ref), Object::Reference(wm_stream_id)];
                            *contents = Object::Array(new_arr);
                        }
                        Object::Array(arr) => {
                            arr.push(Object::Reference(wm_stream_id));
                        }
                        _ => {
                            *contents = Object::Reference(wm_stream_id);
                        }
                    }
                } else {
                    page_dict.set("Contents", Object::Reference(wm_stream_id));
                }
            }
        }
    }

    let out_file = Path::new(output_path);
    if let Some(parent) = out_file.parent() {
        fs::create_dir_all(parent)?;
    }

    doc.save(out_file).map_err(|e| {
        AppError::ExecutionError(format!("Gagal menyimpan PDF dengan watermark: {}", e))
    })?;

    let out_meta = fs::metadata(out_file)?;
    Ok(ConversionResult {
        success: true,
        output_path: out_file.to_string_lossy().to_string(),
        duration_ms: start.elapsed().as_millis(),
        file_size_bytes: out_meta.len(),
        total_pages,
        ..Default::default()
    })
}
