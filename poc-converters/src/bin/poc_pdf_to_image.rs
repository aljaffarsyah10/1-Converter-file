use pdf_render::pdf_interpret::InterpreterSettings;
use pdf_render::pdf_interpret::pdf_syntax::Pdf;
use pdf_render::vello_cpu::color::palette::css::WHITE;
use pdf_render::{render, RenderSettings};
use std::fs;
use std::path::Path;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let pdf_bytes = fs::read("fixtures/sample1.pdf")?;
    println!("Loaded sample1.pdf: {} bytes", pdf_bytes.len());

    let pdf = Pdf::new(pdf_bytes).map_err(|e| format!("Failed to parse PDF: {:?}", e))?;
    let pages = pdf.pages();
    println!("Total pages: {}", pages.len());

    fs::create_dir_all("output/poc_pdf2img")?;

    for (idx, page) in pages.iter().enumerate() {
        let page_num = idx + 1;
        // Scale 2.0 = ~144 DPI (crisp and high resolution)
        let pixmap = render(
            page,
            &InterpreterSettings::default(),
            &RenderSettings {
                x_scale: 2.0,
                y_scale: 2.0,
                bg_color: WHITE,
                ..Default::default()
            },
        );

        let width = pixmap.width() as u32;
        let height = pixmap.height() as u32;
        println!("Page {}: {}x{} px", page_num, width, height);

        let img: image::ImageBuffer<image::Rgba<u8>, Vec<u8>> =
            image::ImageBuffer::from_raw(width, height, pixmap.data_as_u8_slice().to_vec())
                .ok_or("Failed to create ImageBuffer from pixmap")?;

        let png_path = format!("output/poc_pdf2img/page_{}.png", page_num);
        img.save(&png_path)?;

        let metadata = fs::metadata(&png_path)?;
        println!("Saved PNG: {} ({} bytes)", png_path, metadata.len());

        // Also test JPG
        let rgb_img = image::DynamicImage::ImageRgba8(img).to_rgb8();
        let jpg_path = format!("output/poc_pdf2img/page_{}.jpg", page_num);
        rgb_img.save(&jpg_path)?;
        let jpg_meta = fs::metadata(&jpg_path)?;
        println!("Saved JPG: {} ({} bytes)", jpg_path, jpg_meta.len());
    }

    println!("SUCCESS! PDF to Image rendering completed flawlessly!");
    Ok(())
}

