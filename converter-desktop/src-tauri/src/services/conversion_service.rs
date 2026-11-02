use crate::converters::{
    docx_to_pdf, excel_to_pdf, image_compress, image_convert, image_resize, image_to_pdf, pdf_compress, pdf_merge, pdf_protect, pdf_rotate,
    pdf_split, pdf_to_excel, pdf_to_image, pdf_to_word, pdf_unlock, pdf_watermark, pptx_to_pdf,
};
use crate::errors::AppError;
use crate::models::{
    CompressImageRequest, CompressPdfRequest, ConversionResult, ConvertImageRequest, ExcelToPdfRequest, ImageToPdfRequest, MergePdfRequest,
    PdfToExcelRequest, PdfToImageRequest, PdfToWordRequest, PptxToPdfRequest, ProgressEvent,
    ProtectPdfRequest, ResizeImageRequest, RotatePdfRequest, SplitPdfRequest, UnlockPdfRequest, WatermarkPdfRequest, WordToPdfRequest,
};
use tauri::{AppHandle, Emitter};

pub fn emit_progress(app: &AppHandle, job_id: &str, percent: u32, stage: &str) {
    let payload = ProgressEvent {
        job_id: job_id.to_string(),
        percent,
        stage: stage.to_string(),
    };
    let _ = app.emit("conversion-progress", payload);
}

pub fn execute_merge_pdf(
    app: AppHandle,
    job_id: String,
    req: MergePdfRequest,
) -> Result<ConversionResult, AppError> {
    emit_progress(&app, &job_id, 10, "Memvalidasi berkas PDF input...");
    let result = pdf_merge::merge_pdf_files(&req.input_paths, &req.output_path)?;
    emit_progress(&app, &job_id, 100, "Penggabungan PDF selesai");
    Ok(result)
}

pub fn execute_split_pdf(
    app: AppHandle,
    job_id: String,
    req: SplitPdfRequest,
) -> Result<ConversionResult, AppError> {
    emit_progress(&app, &job_id, 10, "Menganalisis halaman PDF...");
    let result = pdf_split::split_pdf_file(
        &req.input_path,
        &req.output_dir,
        &req.output_prefix,
        &req.mode,
        req.page_range.as_deref(),
    )?;
    emit_progress(&app, &job_id, 100, "Pemotongan PDF selesai");
    Ok(result)
}

pub fn execute_image_to_pdf(
    app: AppHandle,
    job_id: String,
    req: ImageToPdfRequest,
) -> Result<ConversionResult, AppError> {
    emit_progress(&app, &job_id, 15, "Mendekode gambar dan menghitung dimensi...");
    let result = image_to_pdf::convert_images_to_pdf(
        &req.input_paths,
        &req.output_path,
        req.orientation.as_deref(),
        req.margin.as_deref(),
    )?;
    emit_progress(&app, &job_id, 100, "Konversi gambar ke PDF selesai");
    Ok(result)
}

pub fn execute_word_to_pdf(
    app: AppHandle,
    job_id: String,
    req: WordToPdfRequest,
) -> Result<ConversionResult, AppError> {
    emit_progress(&app, &job_id, 15, "Menyiapkan engine dokumen Office...");
    let result = docx_to_pdf::convert_docx_to_pdf(&req.input_path, &req.output_path)?;
    emit_progress(&app, &job_id, 100, "Konversi DOCX ke PDF selesai");
    Ok(result)
}

pub fn execute_pdf_to_word(
    app: AppHandle,
    job_id: String,
    req: PdfToWordRequest,
) -> Result<ConversionResult, AppError> {
    emit_progress(&app, &job_id, 15, "Menganalisis teks & tata letak PDF...");
    let result = pdf_to_word::convert_pdf_to_docx(&req.input_path, &req.output_path)?;
    emit_progress(&app, &job_id, 100, "Konversi PDF ke DOCX selesai");
    Ok(result)
}

pub fn execute_pdf_to_image(
    app: AppHandle,
    job_id: String,
    req: PdfToImageRequest,
) -> Result<ConversionResult, AppError> {
    emit_progress(&app, &job_id, 15, "Merasterisasi halaman PDF menjadi gambar...");
    let result = pdf_to_image::convert_pdf_to_images(
        &req.input_path,
        &req.output_dir,
        req.output_prefix.as_deref(),
        req.format.as_deref(),
        req.dpi,
        req.page_range.as_deref(),
    )?;
    emit_progress(&app, &job_id, 100, "Konversi PDF ke gambar selesai");
    Ok(result)
}

pub fn execute_compress_pdf(
    app: AppHandle,
    job_id: String,
    req: CompressPdfRequest,
) -> Result<ConversionResult, AppError> {
    emit_progress(&app, &job_id, 20, "Mengoptimalkan dan mengompresi struktur PDF...");
    let result = pdf_compress::compress_pdf_file(&req.input_path, &req.output_path, req.level.as_deref())?;
    emit_progress(&app, &job_id, 100, "Kompresi PDF selesai");
    Ok(result)
}

pub fn execute_excel_to_pdf(
    app: AppHandle,
    job_id: String,
    req: ExcelToPdfRequest,
) -> Result<ConversionResult, AppError> {
    emit_progress(&app, &job_id, 15, "Menyiapkan engine dokumen spreadsheet...");
    let result = excel_to_pdf::convert_excel_to_pdf(&req.input_path, &req.output_path)?;
    emit_progress(&app, &job_id, 100, "Konversi Excel ke PDF selesai");
    Ok(result)
}

pub fn execute_pptx_to_pdf(
    app: AppHandle,
    job_id: String,
    req: PptxToPdfRequest,
) -> Result<ConversionResult, AppError> {
    emit_progress(&app, &job_id, 15, "Menyiapkan engine dokumen presentasi...");
    let result = pptx_to_pdf::convert_pptx_to_pdf(&req.input_path, &req.output_path)?;
    emit_progress(&app, &job_id, 100, "Konversi PowerPoint ke PDF selesai");
    Ok(result)
}

pub fn execute_pdf_to_excel(
    app: AppHandle,
    job_id: String,
    req: PdfToExcelRequest,
) -> Result<ConversionResult, AppError> {
    emit_progress(&app, &job_id, 15, "Menganalisis tabel & mengekstrak data PDF...");
    let result = pdf_to_excel::convert_pdf_to_excel(&req.input_path, &req.output_path)?;
    emit_progress(&app, &job_id, 100, "Konversi PDF ke Excel selesai");
    Ok(result)
}

pub fn execute_rotate_pdf(
    app: AppHandle,
    job_id: String,
    req: RotatePdfRequest,
) -> Result<ConversionResult, AppError> {
    emit_progress(&app, &job_id, 20, "Memproses rotasi halaman PDF...");
    let result = pdf_rotate::rotate_pdf_pages(
        &req.input_path,
        &req.output_path,
        req.angle,
        req.page_range.as_deref(),
    )?;
    emit_progress(&app, &job_id, 100, "Rotasi PDF selesai");
    Ok(result)
}

pub fn execute_protect_pdf(
    app: AppHandle,
    job_id: String,
    req: ProtectPdfRequest,
) -> Result<ConversionResult, AppError> {
    emit_progress(&app, &job_id, 20, "Menerapkan enkripsi dan password pada PDF...");
    let result = pdf_protect::protect_pdf(&req.input_path, &req.output_path, &req.password)?;
    emit_progress(&app, &job_id, 100, "Proteksi PDF selesai");
    Ok(result)
}

pub fn execute_unlock_pdf(
    app: AppHandle,
    job_id: String,
    req: UnlockPdfRequest,
) -> Result<ConversionResult, AppError> {
    emit_progress(&app, &job_id, 20, "Membuka enkripsi password PDF...");
    let result = pdf_unlock::unlock_pdf(&req.input_path, &req.output_path, &req.password)?;
    emit_progress(&app, &job_id, 100, "Pembukaan proteksi PDF selesai");
    Ok(result)
}
pub fn execute_watermark_pdf(
    app: AppHandle,
    job_id: String,
    req: WatermarkPdfRequest,
) -> Result<ConversionResult, AppError> {
    emit_progress(&app, &job_id, 20, "Menerapkan watermark pada dokumen PDF...");
    let result = pdf_watermark::add_watermark_to_pdf(
        &req.input_path,
        &req.output_path,
        &req.text,
        req.font_size,
        req.opacity,
        req.position.as_deref(),
        req.color.as_deref(),
    )?;
    emit_progress(&app, &job_id, 100, "Penambahan watermark selesai");
    Ok(result)
}
pub fn execute_compress_image(
    app: AppHandle,
    job_id: String,
    req: CompressImageRequest,
) -> Result<ConversionResult, AppError> {
    emit_progress(&app, &job_id, 20, "Mengompresi dan mengoptimalkan gambar...");
    let result = image_compress::compress_image_file(
        &req.input_path,
        &req.output_path,
        req.quality,
        req.level.as_deref(),
    )?;
    emit_progress(&app, &job_id, 100, "Kompresi gambar selesai");
    Ok(result)
}

pub fn execute_convert_image(
    app: AppHandle,
    job_id: String,
    req: ConvertImageRequest,
) -> Result<ConversionResult, AppError> {
    emit_progress(&app, &job_id, 20, "Mengonversi format gambar...");
    let result = image_convert::convert_image_format(
        &req.input_path,
        &req.output_path,
        &req.target_format,
    )?;
    emit_progress(&app, &job_id, 100, "Konversi format gambar selesai");
    Ok(result)
}

pub fn execute_resize_image(
    app: AppHandle,
    job_id: String,
    req: ResizeImageRequest,
) -> Result<ConversionResult, AppError> {
    emit_progress(&app, &job_id, 20, "Mengubah dimensi ukuran gambar...");
    let result = image_resize::resize_image_file(
        &req.input_path,
        &req.output_path,
        req.width,
        req.height,
        req.scale_percent,
        req.maintain_aspect_ratio,
    )?;
    emit_progress(&app, &job_id, 100, "Pengubahan ukuran gambar selesai");
    Ok(result)
}

