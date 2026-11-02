use image::codecs::jpeg::JpegEncoder;
use image::imageops::FilterType;
use image::{DynamicImage, GenericImageView, ImageFormat};
use std::fs::{self, File};
use std::io::BufWriter;
use std::path::Path;

fn test_compress(input: &str, output: &str, quality: u8) {
    let img = image::open(input).expect("open input image");
    let out_file = File::create(output).expect("create output file");
    let mut writer = BufWriter::new(out_file);
    let mut encoder = JpegEncoder::new_with_quality(&mut writer, quality);
    encoder.encode_image(&img).expect("encode jpeg");
    println!("Compressed {} -> {} with quality {}", input, output, quality);
}

fn test_convert(input: &str, output: &str, target_format: ImageFormat) {
    let img = image::open(input).expect("open input image");
    let mut out_file = File::create(output).expect("create output file");
    if target_format == ImageFormat::Jpeg && img.color().has_alpha() {
        let rgb_img = img.to_rgb8();
        rgb_img.write_to(&mut out_file, target_format).expect("write jpeg without alpha");
    } else {
        img.write_to(&mut out_file, target_format).expect("write target format");
    }
    println!("Converted {} -> {} as {:?}", input, output, target_format);
}

fn test_resize(input: &str, output: &str, target_w: u32, target_h: u32) {
    let img = image::open(input).expect("open input image");
    let resized = img.resize(target_w, target_h, FilterType::Lanczos3);
    resized.save(output).expect("save resized");
    println!(
        "Resized {} ({}x{}) -> {} ({}x{})",
        input,
        img.width(),
        img.height(),
        output,
        resized.width(),
        resized.height()
    );
}

fn main() {
    println!("=== Testing Image Tools PoC ===");
    let fixture_png = "poc-converters/fixtures/sample.png";
    let fixture_jpg = "poc-converters/fixtures/sample.jpg";

    let out_dir = "poc-converters/output";
    let _ = fs::create_dir_all(out_dir);

    // 1. Compress
    let comp_out = format!("{}/poc_compressed.jpg", out_dir);
    test_compress(fixture_jpg, &comp_out, 40);
    let orig_size = fs::metadata(fixture_jpg).unwrap().len();
    let comp_size = fs::metadata(&comp_out).unwrap().len();
    println!("Original size: {} bytes, Compressed size: {} bytes", orig_size, comp_size);

    // 2. Convert PNG -> WebP & PNG -> JPG
    let conv_webp = format!("{}/poc_converted.webp", out_dir);
    test_convert(fixture_png, &conv_webp, ImageFormat::WebP);
    let conv_jpg = format!("{}/poc_converted.jpg", out_dir);
    test_convert(fixture_png, &conv_jpg, ImageFormat::Jpeg);

    // 3. Resize
    let resize_out = format!("{}/poc_resized.png", out_dir);
    test_resize(fixture_png, &resize_out, 64, 64);

    println!("All image tool operations completed successfully!");
}

