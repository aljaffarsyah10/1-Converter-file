export interface StagedFile {
  id: string;
  name: string;
  size: number; // in bytes
  sizeFormatted: string;
  path?: string;
  format: string;
  lastModified?: number;
}

export interface MergePdfOptions {
  outputFileName: string;
}

export interface SplitPdfOptions {
  splitMode: "extract_range" | "split_all";
  pageRange: string; // e.g. "1-3, 5, 8-10"
  outputPrefix: string;
}

export interface ImageToPdfOptions {
  orientation: "auto" | "portrait" | "landscape";
  pageSize: "A4" | "FitImage";
  margin: "none" | "small" | "normal";
  outputFileName: string;
}

export interface WordToPdfOptions {
  outputFileName: string;
  openAfterConvert: boolean;
}

export type ToolOptionsState =
  | { type: "merge-pdf"; options: MergePdfOptions }
  | { type: "split-pdf"; options: SplitPdfOptions }
  | { type: "image-to-pdf"; options: ImageToPdfOptions }
  | { type: "word-to-pdf"; options: WordToPdfOptions };

export type ConversionStatus =
  | "idle"
  | "validating"
  | "processing"
  | "success"
  | "error";

export interface MockConversionResult {
  outputPath: string;
  outputFileName: string;
  outputSizeFormatted: string;
  durationMs: number;
  totalPages?: number;
  createdAt: string;
}

export interface ConversionError {
  code: string;
  message: string;
  actionableHint?: string;
}

