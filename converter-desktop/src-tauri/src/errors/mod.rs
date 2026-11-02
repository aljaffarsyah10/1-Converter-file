use serde::Serialize;
use std::fmt;

#[derive(Debug, Serialize)]
#[serde(tag = "code", content = "message")]
pub enum AppError {
    FileNotFound(String),
    InvalidFileFormat { expected: String, actual: String },
    CorruptedFile(String),
    EngineNotAvailable(String),
    InvalidPageRange(String),
    InvalidPassword(String),
    PermissionDenied(String),
    ExecutionError(String),
    IoError(String),
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            AppError::FileNotFound(path) => write!(f, "Berkas tidak ditemukan: {}", path),
            AppError::InvalidFileFormat { expected, actual } => {
                write!(f, "Format berkas tidak sesuai. Diharapkan: {}, Diterima: {}", expected, actual)
            }
            AppError::CorruptedFile(msg) => write!(f, "Berkas rusak atau tidak dapat dibaca: {}", msg),
            AppError::EngineNotAvailable(msg) => write!(f, "Engine konversi tidak tersedia: {}", msg),
            AppError::InvalidPageRange(range) => write!(f, "Rentang halaman tidak valid: {}", range),
            AppError::InvalidPassword(msg) => write!(f, "Kata sandi tidak valid atau salah: {}", msg),
            AppError::PermissionDenied(path) => write!(f, "Akses berkas ditolak: {}", path),
            AppError::ExecutionError(msg) => write!(f, "Gagal menjalankan konversi: {}", msg),
            AppError::IoError(msg) => write!(f, "Kesalahan I/O berkas: {}", msg),
        }
    }
}

impl std::error::Error for AppError {}

impl From<std::io::Error> for AppError {
    fn from(err: std::io::Error) -> Self {
        AppError::IoError(err.to_string())
    }
}

impl From<lopdf::Error> for AppError {
    fn from(err: lopdf::Error) -> Self {
        AppError::CorruptedFile(format!("PDF Parser Error: {}", err))
    }
}

impl From<image::ImageError> for AppError {
    fn from(err: image::ImageError) -> Self {
        AppError::CorruptedFile(format!("Image Decode Error: {}", err))
    }
}

