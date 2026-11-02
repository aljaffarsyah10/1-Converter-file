export interface StagedFile {
  id: string;
  name: string;
  size: number; // in bytes
  sizeFormatted: string;
  path: string; // real absolute path on disk
  format: string;
  lastModified?: number;
}

export interface MergePdfOptions {
  outputFileName: string;
  outputDir?: string;
}

export interface SplitPdfOptions {
  splitMode: "extract_range" | "split_all";
  pageRange: string; // e.g. "1-3, 5, 8-10"
  outputPrefix: string;
  outputDir?: string;
}

export interface ImageToPdfOptions {
  orientation: "auto" | "portrait" | "landscape";
  pageSize: "A4" | "FitImage";
  margin: "none" | "small" | "normal";
  outputFileName: string;
  outputDir?: string;
}

export interface WordToPdfOptions {
  outputFileName: string;
  outputDir?: string;
  openAfterConvert: boolean;
}

export interface PdfToWordOptions {
  outputFileName: string;
  outputDir?: string;
  openAfterConvert: boolean;
}

export interface PdfToImageOptions {
  outputPrefix: string;
  outputDir?: string;
  format: "png" | "jpg";
  dpi: 150 | 300;
  pageRange?: string;
}

export interface CompressPdfOptions {
  outputFileName: string;
  outputDir?: string;
  level: "low" | "medium" | "high";
}

export interface ExcelToPdfOptions {
  outputFileName: string;
  outputDir?: string;
  openAfterConvert: boolean;
}

export interface PptxToPdfOptions {
  outputFileName: string;
  outputDir?: string;
  openAfterConvert: boolean;
}

export type ToolOptionsState =
  | { type: "merge-pdf"; options: MergePdfOptions }
  | { type: "split-pdf"; options: SplitPdfOptions }
  | { type: "image-to-pdf"; options: ImageToPdfOptions }
  | { type: "word-to-pdf"; options: WordToPdfOptions }
  | { type: "pdf-to-word"; options: PdfToWordOptions }
  | { type: "pdf-to-image"; options: PdfToImageOptions }
  | { type: "compress-pdf"; options: CompressPdfOptions }
  | { type: "excel-to-pdf"; options: ExcelToPdfOptions }
  | { type: "pptx-to-pdf"; options: PptxToPdfOptions };

export type ConversionStatus =
  | "idle"
  | "validating"
  | "processing"
  | "success"
  | "error";

export interface ConversionResult {
  outputPath: string;
  outputFileName: string;
  outputSizeFormatted: string;
  durationMs: number;
  totalPages?: number;
  createdAt: string;
  originalSizeBytes?: number;
  compressedSizeBytes?: number;
  reductionPercent?: number;
}

// Backward compatibility alias
export type MockConversionResult = ConversionResult;

export interface ConversionError {
  code: string;
  message: string;
  actionableHint?: string;
}

export interface SystemEngineInfo {
  word_com_available: boolean;
  libreoffice_available: boolean;
  libreoffice_path?: string | null;
}

export interface ProgressEventPayload {
  job_id: string;
  percent: number;
  stage: string;
}

export interface ProgressEventPayload {
  job_id: string;
  percent: number;
  stage: string;
}

