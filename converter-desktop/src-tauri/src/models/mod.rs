use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct MergePdfRequest {
    pub input_paths: Vec<String>,
    pub output_path: String,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SplitPdfRequest {
    pub input_path: String,
    pub output_dir: String,
    pub output_prefix: String,
    pub mode: String, // "extract_range" or "split_all"
    pub page_range: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ImageToPdfRequest {
    pub input_paths: Vec<String>,
    pub output_path: String,
    pub orientation: Option<String>, // "auto", "portrait", "landscape"
    pub margin: Option<String>,      // "none", "small", "normal"
}

#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct WordToPdfRequest {
    pub input_path: String,
    pub output_path: String,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ExcelToPdfRequest {
    pub input_path: String,
    pub output_path: String,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PptxToPdfRequest {
    pub input_path: String,
    pub output_path: String,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PdfToWordRequest {
    pub input_path: String,
    pub output_path: String,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PdfToExcelRequest {
    pub input_path: String,
    pub output_path: String,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct RotatePdfRequest {
    pub input_path: String,
    pub output_path: String,
    pub angle: i64,
    pub page_range: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ProtectPdfRequest {
    pub input_path: String,
    pub output_path: String,
    pub password: String,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct UnlockPdfRequest {
    pub input_path: String,
    pub output_path: String,
    pub password: String,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct WatermarkPdfRequest {
    pub input_path: String,
    pub output_path: String,
    pub text: String,
    pub font_size: Option<f64>,
    pub opacity: Option<f64>,
    pub position: Option<String>,
    pub color: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CompressImageRequest {
    pub input_path: String,
    pub output_path: String,
    pub quality: Option<u8>,
    pub level: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ConvertImageRequest {
    pub input_path: String,
    pub output_path: String,
    pub target_format: String,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ResizeImageRequest {
    pub input_path: String,
    pub output_path: String,
    pub width: Option<u32>,
    pub height: Option<u32>,
    pub scale_percent: Option<f64>,
    pub maintain_aspect_ratio: Option<bool>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PdfToImageRequest {
    pub input_path: String,
    pub output_dir: String,
    pub output_prefix: Option<String>,
    pub format: Option<String>, // "png" or "jpg"
    pub dpi: Option<u32>,       // 150, 300
    pub page_range: Option<String>,
}

#[derive(Debug, Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CompressPdfRequest {
    pub input_path: String,
    pub output_path: String,
    pub level: Option<String>, // "low", "medium", "high"
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct ConversionResult {
    pub success: bool,
    pub output_path: String,
    pub duration_ms: u128,
    pub file_size_bytes: u64,
    pub total_pages: usize,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub original_size_bytes: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub compressed_size_bytes: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reduction_percent: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ProgressEvent {
    pub job_id: String,
    pub percent: u32,
    pub stage: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SystemEngineInfo {
    pub word_com_available: bool,
    pub libreoffice_available: bool,
    pub libreoffice_path: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct FileMetadata {
    pub id: String,
    pub name: String,
    pub path: String,
    pub size: u64,
    pub size_formatted: String,
    pub format: String,
    pub last_modified: u64,
}
