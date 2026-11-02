import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/plugin-dialog";
import { openPath, revealItemInDir } from "@tauri-apps/plugin-opener";
import {
  ConversionError,
  ConversionResult,
  ImageToPdfOptions,
  MergePdfOptions,
  ProgressEventPayload,
  SplitPdfOptions,
  StagedFile,
  SystemEngineInfo,
  WordToPdfOptions,
  PdfToWordOptions,
  PdfToImageOptions,
  CompressPdfOptions,
  ExcelToPdfOptions,
  PptxToPdfOptions,
  PdfToExcelOptions,
  ProtectPdfOptions,
  RotatePdfOptions,
  UnlockPdfOptions,
  WatermarkPdfOptions,
  CompressImageOptions,
  ConvertImageOptions,
  ResizeImageOptions,
  HtmlToPdfOptions,
  MarkdownToPdfOptions,
} from "@/types/conversion";

interface BackendConversionResult {
  success: boolean;
  outputPath: string;
  durationMs: number;
  fileSizeBytes: number;
  totalPages: number;
  originalSizeBytes?: number;
  compressedSizeBytes?: number;
  reductionPercent?: number;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function extractFileName(filePath: string): string {
  return filePath.split(/[/\\]/).pop() || filePath;
}

export function isTauriEnvironment(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export async function getDefaultOutputDir(): Promise<string> {
  if (!isTauriEnvironment()) {
    return "C:\\Users\\Downloads\\Converted";
  }
  try {
    return await invoke<string>("get_default_output_dir");
  } catch (err) {
    console.warn("Failed to get default output dir from backend:", err);
    return "";
  }
}

export async function getSystemEngineInfo(): Promise<SystemEngineInfo> {
  if (!isTauriEnvironment()) {
    return {
      word_com_available: true,
      libreoffice_available: false,
      libreoffice_path: null,
    };
  }
  try {
    return await invoke<SystemEngineInfo>("get_system_engine_info");
  } catch (err) {
    console.warn("Failed to get system engine info:", err);
    return {
      word_com_available: false,
      libreoffice_available: false,
      libreoffice_path: null,
    };
  }
}

export async function getFilesMetadata(paths: string[]): Promise<StagedFile[]> {
  if (!isTauriEnvironment() || paths.length === 0) {
    return [];
  }
  try {
    const rawList = await invoke<
      Array<{
        id: string;
        name: string;
        path: string;
        size: number;
        sizeFormatted: string;
        format: string;
        lastModified: number;
      }>
    >("get_files_metadata", { paths });

    return rawList.map((item) => ({
      id: item.id || `${item.name}-${Date.now()}`,
      name: item.name,
      path: item.path,
      size: item.size,
      sizeFormatted: item.sizeFormatted,
      format: item.format,
      lastModified: item.lastModified,
    }));
  } catch (err) {
    console.error("Error retrieving file metadata:", err);
    return [];
  }
}

export async function pickFiles(
  acceptedExtensions: string[],
  multiple: boolean = true
): Promise<StagedFile[]> {
  if (!isTauriEnvironment()) {
    throw new Error("Pilih berkas native hanya tersedia dalam aplikasi desktop.");
  }

  const cleanExtensions = acceptedExtensions.map((ext) =>
    ext.startsWith(".") ? ext.slice(1) : ext
  );

  const selected = await open({
    multiple,
    directory: false,
    filters: [
      {
        name: "Format Yang Didukung",
        extensions: cleanExtensions,
      },
    ],
  });

  if (!selected) {
    return [];
  }

  const paths = Array.isArray(selected) ? selected : [selected];
  return await getFilesMetadata(paths);
}

export async function pickDirectory(defaultPath?: string): Promise<string | null> {
  if (!isTauriEnvironment()) {
    return null;
  }
  const selected = await open({
    directory: true,
    multiple: false,
    defaultPath,
  });
  return typeof selected === "string" ? selected : null;
}

export async function openResultFile(filePath: string): Promise<void> {
  if (!isTauriEnvironment()) {
    window.open(filePath, "_blank");
    return;
  }
  await openPath(filePath);
}

export async function revealResultFile(filePath: string): Promise<void> {
  if (!isTauriEnvironment()) {
    return;
  }
  await revealItemInDir(filePath);
}

function parseBackendError(error: unknown): ConversionError {
  const message = typeof error === "string" ? error : (error as Error)?.message || "Terjadi kesalahan yang tidak diketahui.";
  
  if (message.includes("does not exist") || message.includes("tidak ditemukan")) {
    return {
      code: "FILE_NOT_FOUND",
      message,
      actionableHint: "Pastikan berkas sumber masih ada di lokasi asalnya dan belum dipindahkan.",
    };
  }
  if (message.includes("Corrupted") || message.includes("damaged") || message.includes("Invalid")) {
    return {
      code: "CORRUPTED_FILE",
      message,
      actionableHint: "Berkas mungkin rusak atau tidak sesuai dengan standar format. Coba periksa berkas asli.",
    };
  }
  if (message.includes("range") || message.includes("out of bounds") || message.includes("Invalid page range")) {
    return {
      code: "INVALID_PAGE_RANGE",
      message,
      actionableHint: "Periksa kembali nomor halaman yang dimasukkan agar sesuai dengan jumlah halaman dokumen.",
    };
  }
  if (message.includes("Word or LibreOffice")) {
    return {
      code: "NO_DOCX_ENGINE",
      message,
      actionableHint: "Pasang Microsoft Word atau LibreOffice untuk melakukan konversi DOCX ke PDF di komputer ini.",
    };
  }

  return {
    code: "CONVERSION_FAILED",
    message,
    actionableHint: "Coba ulangi proses dengan opsi default atau periksa izin akses direktori tujuan.",
  };
}

export async function executeTauriMergePdf(
  files: StagedFile[],
  options: MergePdfOptions,
  onProgress?: (percent: number, stage: string) => void
): Promise<ConversionResult> {
  const jobId = `job-merge-${Date.now()}`;
  let unlisten: UnlistenFn | undefined;

  if (onProgress) {
    unlisten = await listen<ProgressEventPayload>("conversion-progress", (event) => {
      if (event.payload.job_id === jobId) {
        onProgress(event.payload.percent, event.payload.stage);
      }
    });
  }

  try {
    const outDir = options.outputDir || (await getDefaultOutputDir());
    const outFileName = options.outputFileName.endsWith(".pdf")
      ? options.outputFileName
      : `${options.outputFileName}.pdf`;
    const outputPath = `${outDir.replace(/[/\\]$/, "")}\\${outFileName}`;

    const inputPaths = files.map((f) => f.path);

    const result = await invoke<BackendConversionResult>("convert_merge_pdf", {
      jobId,
      request: {
        inputPaths,
        outputPath,
      },
    });

    return {
      outputPath: result.outputPath,
      outputFileName: extractFileName(result.outputPath),
      outputSizeFormatted: formatBytes(result.fileSizeBytes),
      durationMs: Number(result.durationMs),
      totalPages: result.totalPages,
      createdAt: new Date().toLocaleTimeString("id-ID"),
    };
  } catch (err) {
    throw parseBackendError(err);
  } finally {
    if (unlisten) unlisten();
  }
}

export async function executeTauriSplitPdf(
  file: StagedFile,
  options: SplitPdfOptions,
  onProgress?: (percent: number, stage: string) => void
): Promise<ConversionResult> {
  const jobId = `job-split-${Date.now()}`;
  let unlisten: UnlistenFn | undefined;

  if (onProgress) {
    unlisten = await listen<ProgressEventPayload>("conversion-progress", (event) => {
      if (event.payload.job_id === jobId) {
        onProgress(event.payload.percent, event.payload.stage);
      }
    });
  }

  try {
    const outDir = options.outputDir || (await getDefaultOutputDir());
    const outputPrefix = options.outputPrefix || "split_document";

    const result = await invoke<BackendConversionResult>("convert_split_pdf", {
      jobId,
      request: {
        inputPath: file.path,
        outputDir: outDir,
        outputPrefix,
        mode: options.splitMode,
        pageRange: options.splitMode === "extract_range" ? options.pageRange : null,
      },
    });

    return {
      outputPath: result.outputPath,
      outputFileName: extractFileName(result.outputPath),
      outputSizeFormatted: formatBytes(result.fileSizeBytes),
      durationMs: Number(result.durationMs),
      totalPages: result.totalPages,
      createdAt: new Date().toLocaleTimeString("id-ID"),
    };
  } catch (err) {
    throw parseBackendError(err);
  } finally {
    if (unlisten) unlisten();
  }
}

export async function executeTauriImageToPdf(
  files: StagedFile[],
  options: ImageToPdfOptions,
  onProgress?: (percent: number, stage: string) => void
): Promise<ConversionResult> {
  const jobId = `job-img-${Date.now()}`;
  let unlisten: UnlistenFn | undefined;

  if (onProgress) {
    unlisten = await listen<ProgressEventPayload>("conversion-progress", (event) => {
      if (event.payload.job_id === jobId) {
        onProgress(event.payload.percent, event.payload.stage);
      }
    });
  }

  try {
    const outDir = options.outputDir || (await getDefaultOutputDir());
    const outFileName = options.outputFileName.endsWith(".pdf")
      ? options.outputFileName
      : `${options.outputFileName}.pdf`;
    const outputPath = `${outDir.replace(/[/\\]$/, "")}\\${outFileName}`;

    const inputPaths = files.map((f) => f.path);

    const result = await invoke<BackendConversionResult>("convert_image_to_pdf", {
      jobId,
      request: {
        inputPaths,
        outputPath,
        orientation: options.orientation,
        margin: options.margin,
      },
    });

    return {
      outputPath: result.outputPath,
      outputFileName: extractFileName(result.outputPath),
      outputSizeFormatted: formatBytes(result.fileSizeBytes),
      durationMs: Number(result.durationMs),
      totalPages: result.totalPages,
      createdAt: new Date().toLocaleTimeString("id-ID"),
    };
  } catch (err) {
    throw parseBackendError(err);
  } finally {
    if (unlisten) unlisten();
  }
}

export async function executeTauriWordToPdf(
  file: StagedFile,
  options: WordToPdfOptions,
  onProgress?: (percent: number, stage: string) => void
): Promise<ConversionResult> {
  const jobId = `job-docx-${Date.now()}`;
  let unlisten: UnlistenFn | undefined;

  if (onProgress) {
    unlisten = await listen<ProgressEventPayload>("conversion-progress", (event) => {
      if (event.payload.job_id === jobId) {
        onProgress(event.payload.percent, event.payload.stage);
      }
    });
  }

  try {
    const outDir = options.outputDir || (await getDefaultOutputDir());
    const outFileName = options.outputFileName.endsWith(".pdf")
      ? options.outputFileName
      : `${options.outputFileName}.pdf`;
    const outputPath = `${outDir.replace(/[/\\]$/, "")}\\${outFileName}`;

    const result = await invoke<BackendConversionResult>("convert_word_to_pdf", {
      jobId,
      request: {
        inputPath: file.path,
        outputPath,
      },
    });

    if (options.openAfterConvert && isTauriEnvironment()) {
      try {
        await openPath(result.outputPath);
      } catch (e) {
        console.warn("Could not automatically open converted PDF:", e);
      }
    }

    return {
      outputPath: result.outputPath,
      outputFileName: extractFileName(result.outputPath),
      outputSizeFormatted: formatBytes(result.fileSizeBytes),
      durationMs: Number(result.durationMs),
      totalPages: result.totalPages,
      createdAt: new Date().toLocaleTimeString("id-ID"),
    };
  } catch (err) {
    throw parseBackendError(err);
  } finally {
    if (unlisten) unlisten();
  }
}


export async function executeTauriPdfToWord(
  file: StagedFile,
  options: PdfToWordOptions,
  onProgress?: (percent: number, stage: string) => void
): Promise<ConversionResult> {
  const jobId = `job-pdf2word-${Date.now()}`;
  let unlisten: UnlistenFn | undefined;

  if (onProgress) {
    unlisten = await listen<ProgressEventPayload>("conversion-progress", (event) => {
      if (event.payload.job_id === jobId) {
        onProgress(event.payload.percent, event.payload.stage);
      }
    });
  }

  try {
    const outDir = options.outputDir || (await getDefaultOutputDir());
    const outFileName = options.outputFileName.endsWith(".docx")
      ? options.outputFileName
      : `${options.outputFileName}.docx`;
    const outputPath = `${outDir.replace(/[/\\]$/, "")}\\${outFileName}`;

    const result = await invoke<BackendConversionResult>("convert_pdf_to_word", {
      jobId,
      request: {
        inputPath: file.path,
        outputPath,
      },
    });

    if (options.openAfterConvert && isTauriEnvironment()) {
      try {
        await openPath(result.outputPath);
      } catch (e) {
        console.warn("Could not automatically open converted DOCX:", e);
      }
    }

    return {
      outputPath: result.outputPath,
      outputFileName: extractFileName(result.outputPath),
      outputSizeFormatted: formatBytes(result.fileSizeBytes),
      durationMs: Number(result.durationMs),
      totalPages: result.totalPages,
      createdAt: new Date().toLocaleTimeString("id-ID"),
    };
  } catch (err) {
    throw parseBackendError(err);
  } finally {
    if (unlisten) unlisten();
  }
}

export async function executeTauriPdfToImage(
  file: StagedFile,
  options: PdfToImageOptions,
  onProgress?: (percent: number, stage: string) => void
): Promise<ConversionResult> {
  const jobId = `job-pdf2img-${Date.now()}`;
  let unlisten: UnlistenFn | undefined;

  if (onProgress) {
    unlisten = await listen<ProgressEventPayload>("conversion-progress", (event) => {
      if (event.payload.job_id === jobId) {
        onProgress(event.payload.percent, event.payload.stage);
      }
    });
  }

  try {
    const outDir = options.outputDir || (await getDefaultOutputDir());
    const outputPrefix = options.outputPrefix || "page";

    const result = await invoke<BackendConversionResult>("convert_pdf_to_image", {
      jobId,
      request: {
        inputPath: file.path,
        outputDir: outDir,
        outputPrefix,
        format: options.format,
        dpi: options.dpi,
        pageRange: options.pageRange?.trim() ? options.pageRange.trim() : null,
      },
    });

    return {
      outputPath: result.outputPath,
      outputFileName: extractFileName(result.outputPath),
      outputSizeFormatted: formatBytes(result.fileSizeBytes),
      durationMs: Number(result.durationMs),
      totalPages: result.totalPages,
      createdAt: new Date().toLocaleTimeString("id-ID"),
    };
  } catch (err) {
    throw parseBackendError(err);
  } finally {
    if (unlisten) unlisten();
  }
}

export async function executeTauriExcelToPdf(
  file: StagedFile,
  options: ExcelToPdfOptions,
  onProgress?: (percent: number, stage: string) => void
): Promise<ConversionResult> {
  const jobId = `job-excel-${Date.now()}`;
  let unlisten: UnlistenFn | undefined;

  if (onProgress) {
    unlisten = await listen<ProgressEventPayload>("conversion-progress", (event) => {
      if (event.payload.job_id === jobId) {
        onProgress(event.payload.percent, event.payload.stage);
      }
    });
  }

  try {
    const outDir = options.outputDir || (await getDefaultOutputDir());
    const baseName =
      options.outputFileName.replace(/\.pdf$/i, "") ||
      file.name.replace(/\.(xlsx|xls|csv)$/i, "");
    const outputPath = `${outDir}\\${baseName}.pdf`;

    const result = await invoke<BackendConversionResult>("convert_excel_to_pdf", {
      jobId,
      request: {
        inputPath: file.path,
        outputPath,
      },
    });

    const convResult: ConversionResult = {
      outputPath: result.outputPath,
      outputFileName: extractFileName(result.outputPath),
      outputSizeFormatted: formatBytes(result.fileSizeBytes),
      durationMs: Number(result.durationMs),
      totalPages: result.totalPages,
      createdAt: new Date().toLocaleTimeString("id-ID"),
    };

    if (options.openAfterConvert) {
      try {
        await openResultFile(convResult.outputPath);
      } catch {
        // Non-blocking
      }
    }

    return convResult;
  } catch (err) {
    throw parseBackendError(err);
  } finally {
    if (unlisten) unlisten();
  }
}



export async function executeTauriCompressPdf(
  file: StagedFile,
  options: CompressPdfOptions,
  onProgress?: (percent: number, stage: string) => void
): Promise<ConversionResult> {
  const jobId = `job-compress-${Date.now()}`;
  let unlisten: UnlistenFn | undefined;

  if (onProgress) {
    unlisten = await listen<ProgressEventPayload>("conversion-progress", (event) => {
      if (event.payload.job_id === jobId) {
        onProgress(event.payload.percent, event.payload.stage);
      }
    });
  }

  try {
    const outDir = options.outputDir || (await getDefaultOutputDir());
    const baseName =
      options.outputFileName.replace(/\.pdf$/i, "") ||
      file.name.replace(/\.pdf$/i, "") + "-compressed";
    const outputPath = `${outDir}\\${baseName}.pdf`;

    const result = await invoke<BackendConversionResult>("convert_compress_pdf", {
      jobId,
      request: {
        inputPath: file.path,
        outputPath,
        level: options.level,
      },
    });

    return {
      outputPath: result.outputPath,
      outputFileName: extractFileName(result.outputPath),
      outputSizeFormatted: formatBytes(result.fileSizeBytes),
      durationMs: Number(result.durationMs),
      totalPages: result.totalPages,
      createdAt: new Date().toLocaleTimeString("id-ID"),
      originalSizeBytes: result.originalSizeBytes,
      compressedSizeBytes: result.compressedSizeBytes,
      reductionPercent: result.reductionPercent,
    };
  } catch (err) {
    throw parseBackendError(err);
  } finally {
    if (unlisten) unlisten();
  }
}

export async function executeTauriPptxToPdf(
  file: StagedFile,
  options: PptxToPdfOptions,
  onProgress?: (percent: number, stage: string) => void
): Promise<ConversionResult> {
  const jobId = `job-pptx-${Date.now()}`;
  let unlisten: UnlistenFn | undefined;

  if (onProgress) {
    unlisten = await listen<ProgressEventPayload>("conversion-progress", (event) => {
      if (event.payload.job_id === jobId) {
        onProgress(event.payload.percent, event.payload.stage);
      }
    });
  }

  try {
    const outDir = options.outputDir || (await getDefaultOutputDir());
    const baseName =
      options.outputFileName.replace(/\.pdf$/i, "") ||
      file.name.replace(/\.(pptx|ppt)$/i, "");
    const outputPath = `${outDir}\\${baseName}.pdf`;

    const result = await invoke<BackendConversionResult>("convert_pptx_to_pdf", {
      jobId,
      request: {
        inputPath: file.path,
        outputPath,
      },
    });

    const convResult: ConversionResult = {
      outputPath: result.outputPath,
      outputFileName: extractFileName(result.outputPath),
      outputSizeFormatted: formatBytes(result.fileSizeBytes),
      durationMs: Number(result.durationMs),
      totalPages: result.totalPages,
      createdAt: new Date().toLocaleTimeString("id-ID"),
    };

    if (options.openAfterConvert) {
      try {
        await openResultFile(convResult.outputPath);
      } catch {
        // Non-blocking
      }
    }

    return convResult;
  } catch (err) {
    throw parseBackendError(err);
  } finally {
    if (unlisten) unlisten();
  }
}

export async function executeTauriPdfToExcel(
  file: StagedFile,
  options: PdfToExcelOptions,
  onProgress?: (percent: number, stage: string) => void
): Promise<ConversionResult> {
  const jobId = `job-pdf2excel-${Date.now()}`;
  let unlisten: UnlistenFn | undefined;

  if (onProgress) {
    unlisten = await listen<ProgressEventPayload>("conversion-progress", (event) => {
      if (event.payload.job_id === jobId) {
        onProgress(event.payload.percent, event.payload.stage);
      }
    });
  }

  try {
    const outDir = options.outputDir || (await getDefaultOutputDir());
    const baseName =
      options.outputFileName.replace(/\.xlsx$/i, "") ||
      file.name.replace(/\.pdf$/i, "");
    const outputPath = `${outDir}\\${baseName}.xlsx`;

    const result = await invoke<BackendConversionResult>("convert_pdf_to_excel", {
      jobId,
      request: {
        inputPath: file.path,
        outputPath,
      },
    });

    const convResult: ConversionResult = {
      outputPath: result.outputPath,
      outputFileName: extractFileName(result.outputPath),
      outputSizeFormatted: formatBytes(result.fileSizeBytes),
      durationMs: Number(result.durationMs),
      totalPages: result.totalPages,
      createdAt: new Date().toLocaleTimeString("id-ID"),
    };

    if (options.openAfterConvert) {
      try {
        await openResultFile(convResult.outputPath);
      } catch {
        // Non-blocking
      }
    }

    return convResult;
  } catch (err) {
    throw parseBackendError(err);
  } finally {
    if (unlisten) unlisten();
  }
}

export async function executeTauriRotatePdf(
  file: StagedFile,
  options: RotatePdfOptions,
  onProgress?: (percent: number, stage: string) => void
): Promise<ConversionResult> {
  const jobId = `job-rotate-${Date.now()}`;
  let unlisten: UnlistenFn | undefined;

  if (onProgress) {
    unlisten = await listen<ProgressEventPayload>("conversion-progress", (event) => {
      if (event.payload.job_id === jobId) {
        onProgress(event.payload.percent, event.payload.stage);
      }
    });
  }

  try {
    const outDir = options.outputDir || (await getDefaultOutputDir());
    const baseName =
      options.outputFileName.replace(/\.pdf$/i, "") ||
      file.name.replace(/\.pdf$/i, "") + "-rotated";
    const outputPath = `${outDir}\\${baseName}.pdf`;

    const result = await invoke<BackendConversionResult>("convert_rotate_pdf", {
      jobId,
      request: {
        inputPath: file.path,
        outputPath,
        angle: options.angle,
        pageRange: options.pageRange?.trim() ? options.pageRange.trim() : null,
      },
    });

    return {
      outputPath: result.outputPath,
      outputFileName: extractFileName(result.outputPath),
      outputSizeFormatted: formatBytes(result.fileSizeBytes),
      durationMs: Number(result.durationMs),
      totalPages: result.totalPages,
      createdAt: new Date().toLocaleTimeString("id-ID"),
    };
  } catch (err) {
    throw parseBackendError(err);
  } finally {
    if (unlisten) unlisten();
  }
}

export async function executeTauriProtectPdf(
  file: StagedFile,
  options: ProtectPdfOptions,
  onProgress?: (percent: number, stage: string) => void
): Promise<ConversionResult> {
  const jobId = `job-protect-${Date.now()}`;
  let unlisten: UnlistenFn | undefined;

  if (onProgress) {
    unlisten = await listen<ProgressEventPayload>("conversion-progress", (event) => {
      if (event.payload.job_id === jobId) {
        onProgress(event.payload.percent, event.payload.stage);
      }
    });
  }

  try {
    const outDir = options.outputDir || (await getDefaultOutputDir());
    const baseName =
      options.outputFileName.replace(/\.pdf$/i, "") ||
      file.name.replace(/\.pdf$/i, "") + "-protected";
    const outputPath = `${outDir}\\${baseName}.pdf`;

    const result = await invoke<BackendConversionResult>("convert_protect_pdf", {
      jobId,
      request: {
        inputPath: file.path,
        outputPath,
        password: options.password,
      },
    });

    return {
      outputPath: result.outputPath,
      outputFileName: extractFileName(result.outputPath),
      outputSizeFormatted: formatBytes(result.fileSizeBytes),
      durationMs: Number(result.durationMs),
      totalPages: result.totalPages,
      createdAt: new Date().toLocaleTimeString("id-ID"),
    };
  } catch (err) {
    throw parseBackendError(err);
  } finally {
    if (unlisten) unlisten();
  }
}

export async function executeTauriUnlockPdf(
  file: StagedFile,
  options: UnlockPdfOptions,
  onProgress?: (percent: number, stage: string) => void
): Promise<ConversionResult> {
  const jobId = `job-unlock-${Date.now()}`;
  let unlisten: UnlistenFn | undefined;

  if (onProgress) {
    unlisten = await listen<ProgressEventPayload>("conversion-progress", (event) => {
      if (event.payload.job_id === jobId) {
        onProgress(event.payload.percent, event.payload.stage);
      }
    });
  }

  try {
    const outDir = options.outputDir || (await getDefaultOutputDir());
    const baseName =
      options.outputFileName.replace(/\.pdf$/i, "") ||
      file.name.replace(/\.pdf$/i, "") + "-unlocked";
    const outputPath = `${outDir}\\${baseName}.pdf`;

    const result = await invoke<BackendConversionResult>("convert_unlock_pdf", {
      jobId,
      request: {
        inputPath: file.path,
        outputPath,
        password: options.password,
      },
    });

    return {
      outputPath: result.outputPath,
      outputFileName: extractFileName(result.outputPath),
      outputSizeFormatted: formatBytes(result.fileSizeBytes),
      durationMs: Number(result.durationMs),
      totalPages: result.totalPages,
      createdAt: new Date().toLocaleTimeString("id-ID"),
    };
  } catch (err) {
    throw parseBackendError(err);
  } finally {
    if (unlisten) unlisten();
  }
}
export async function executeTauriWatermarkPdf(
  file: StagedFile,
  options: WatermarkPdfOptions,
  onProgress?: (percent: number, stage: string) => void
): Promise<ConversionResult> {
  const jobId = `job-watermark-${Date.now()}`;
  let unlisten: UnlistenFn | undefined;

  if (onProgress) {
    unlisten = await listen<ProgressEventPayload>("conversion-progress", (event) => {
      if (event.payload.job_id === jobId) {
        onProgress(event.payload.percent, event.payload.stage);
      }
    });
  }

  try {
    const outDir = options.outputDir || (await getDefaultOutputDir());
    const baseName =
      options.outputFileName.replace(/\.pdf$/i, "") ||
      file.name.replace(/\.pdf$/i, "") + "-watermarked";
    const outputPath = `${outDir}\\${baseName}.pdf`;

    const fontSizeMap: Record<string, number> = {
      small: 36,
      medium: 54,
      large: 72,
    };
    const fontSize = fontSizeMap[options.fontSize] || 54;

    const opacityMap: Record<string, number> = {
      "10": 0.1,
      "25": 0.25,
      "50": 0.5,
    };
    const opacity = opacityMap[options.opacity] || 0.25;

    const result = await invoke<BackendConversionResult>("convert_watermark_pdf", {
      jobId,
      request: {
        inputPath: file.path,
        outputPath,
        text: options.text,
        fontSize,
        opacity,
        position: options.position,
        color: options.color || "#888888",
      },
    });

    return {
      outputPath: result.outputPath,
      outputFileName: extractFileName(result.outputPath),
      outputSizeFormatted: formatBytes(result.fileSizeBytes),
      durationMs: Number(result.durationMs),
      totalPages: result.totalPages,
      createdAt: new Date().toLocaleTimeString("id-ID"),
    };
  } catch (err) {
    throw parseBackendError(err);
  } finally {
    if (unlisten) unlisten();
  }
}
export async function executeTauriCompressImage(
  file: StagedFile,
  options: CompressImageOptions,
  onProgress?: (percent: number, stage: string) => void
): Promise<ConversionResult> {
  const jobId = `job-img-compress-${Date.now()}`;
  let unlisten: UnlistenFn | undefined;

  if (onProgress) {
    unlisten = await listen<ProgressEventPayload>("conversion-progress", (event) => {
      if (event.payload.job_id === jobId) {
        onProgress(event.payload.percent, event.payload.stage);
      }
    });
  }

  try {
    const outDir = options.outputDir || (await getDefaultOutputDir());
    const ext = file.name.split('.').pop() || "jpg";
    const baseName =
      options.outputFileName.replace(/\.[^/.]+$/, "") ||
      file.name.replace(/\.[^/.]+$/, "") + "-compressed";
    const outputPath = `${outDir}\\${baseName}.${ext}`;

    const result = await invoke<BackendConversionResult>("convert_compress_image", {
      jobId,
      request: {
        inputPath: file.path,
        outputPath,
        quality: options.quality,
        level: options.level,
      },
    });

    return {
      outputPath: result.outputPath,
      outputFileName: extractFileName(result.outputPath),
      outputSizeFormatted: formatBytes(result.fileSizeBytes),
      durationMs: Number(result.durationMs),
      totalPages: 1,
      createdAt: new Date().toLocaleTimeString("id-ID"),
      originalSizeBytes: result.originalSizeBytes,
      compressedSizeBytes: result.fileSizeBytes,
      reductionPercent: result.reductionPercent,
    };
  } catch (err) {
    throw parseBackendError(err);
  } finally {
    if (unlisten) unlisten();
  }
}

export async function executeTauriConvertImage(
  file: StagedFile,
  options: ConvertImageOptions,
  onProgress?: (percent: number, stage: string) => void
): Promise<ConversionResult> {
  const jobId = `job-img-convert-${Date.now()}`;
  let unlisten: UnlistenFn | undefined;

  if (onProgress) {
    unlisten = await listen<ProgressEventPayload>("conversion-progress", (event) => {
      if (event.payload.job_id === jobId) {
        onProgress(event.payload.percent, event.payload.stage);
      }
    });
  }

  try {
    const outDir = options.outputDir || (await getDefaultOutputDir());
    const baseName =
      options.outputFileName.replace(/\.[^/.]+$/, "") ||
      file.name.replace(/\.[^/.]+$/, "") + "-converted";
    const targetExt = options.targetFormat.toLowerCase();
    const outputPath = `${outDir}\\${baseName}.${targetExt}`;

    const result = await invoke<BackendConversionResult>("convert_convert_image", {
      jobId,
      request: {
        inputPath: file.path,
        outputPath,
        targetFormat: options.targetFormat,
      },
    });

    return {
      outputPath: result.outputPath,
      outputFileName: extractFileName(result.outputPath),
      outputSizeFormatted: formatBytes(result.fileSizeBytes),
      durationMs: Number(result.durationMs),
      totalPages: 1,
      createdAt: new Date().toLocaleTimeString("id-ID"),
    };
  } catch (err) {
    throw parseBackendError(err);
  } finally {
    if (unlisten) unlisten();
  }
}

export async function executeTauriResizeImage(
  file: StagedFile,
  options: ResizeImageOptions,
  onProgress?: (percent: number, stage: string) => void
): Promise<ConversionResult> {
  const jobId = `job-img-resize-${Date.now()}`;
  let unlisten: UnlistenFn | undefined;

  if (onProgress) {
    unlisten = await listen<ProgressEventPayload>("conversion-progress", (event) => {
      if (event.payload.job_id === jobId) {
        onProgress(event.payload.percent, event.payload.stage);
      }
    });
  }

  try {
    const outDir = options.outputDir || (await getDefaultOutputDir());
    const ext = file.name.split('.').pop() || "png";
    const baseName =
      options.outputFileName.replace(/\.[^/.]+$/, "") ||
      file.name.replace(/\.[^/.]+$/, "") + "-resized";
    const outputPath = `${outDir}\\${baseName}.${ext}`;

    const result = await invoke<BackendConversionResult>("convert_resize_image", {
      jobId,
      request: {
        inputPath: file.path,
        outputPath,
        width: options.resizeMode === "dimensions" ? options.width || null : null,
        height: options.resizeMode === "dimensions" ? options.height || null : null,
        scalePercent: options.resizeMode === "percentage" ? options.scalePercent || null : null,
        maintainAspectRatio: options.maintainAspectRatio,
      },
    });

    return {
      outputPath: result.outputPath,
      outputFileName: extractFileName(result.outputPath),
      outputSizeFormatted: formatBytes(result.fileSizeBytes),
      durationMs: Number(result.durationMs),
      totalPages: 1,
      createdAt: new Date().toLocaleTimeString("id-ID"),
    };
  } catch (err) {
    throw parseBackendError(err);
  } finally {
    if (unlisten) unlisten();
  }
}
export async function executeTauriHtmlToPdf(
  file: StagedFile,
  options: HtmlToPdfOptions,
  onProgress?: (percent: number, stage: string) => void
): Promise<ConversionResult> {
  const jobId = `job-html-pdf-${Date.now()}`;
  let unlisten: UnlistenFn | undefined;

  if (onProgress) {
    unlisten = await listen<ProgressEventPayload>("conversion-progress", (event) => {
      if (event.payload.job_id === jobId) {
        onProgress(event.payload.percent, event.payload.stage);
      }
    });
  }

  try {
    const outDir = options.outputDir || (await getDefaultOutputDir());
    const baseName =
      options.outputFileName.replace(/\.pdf$/i, "") ||
      file.name.replace(/\.[^/.]+$/, "") + "-rendered";
    const outputPath = `${outDir}\\${baseName}.pdf`;

    const result = await invoke<BackendConversionResult>("convert_html_to_pdf", {
      jobId,
      request: {
        inputPath: file.path,
        outputPath,
        pageSize: options.pageSize,
        margin: options.margin,
        orientation: options.orientation,
      },
    });

    return {
      outputPath: result.outputPath,
      outputFileName: extractFileName(result.outputPath),
      outputSizeFormatted: formatBytes(result.fileSizeBytes),
      durationMs: Number(result.durationMs),
      totalPages: result.totalPages,
      createdAt: new Date().toLocaleTimeString("id-ID"),
    };
  } catch (err) {
    throw parseBackendError(err);
  } finally {
    if (unlisten) unlisten();
  }
}

export async function executeTauriMarkdownToPdf(
  file: StagedFile,
  options: MarkdownToPdfOptions,
  onProgress?: (percent: number, stage: string) => void
): Promise<ConversionResult> {
  const jobId = `job-md-pdf-${Date.now()}`;
  let unlisten: UnlistenFn | undefined;

  if (onProgress) {
    unlisten = await listen<ProgressEventPayload>("conversion-progress", (event) => {
      if (event.payload.job_id === jobId) {
        onProgress(event.payload.percent, event.payload.stage);
      }
    });
  }

  try {
    const outDir = options.outputDir || (await getDefaultOutputDir());
    const baseName =
      options.outputFileName.replace(/\.pdf$/i, "") ||
      file.name.replace(/\.[^/.]+$/, "") + "-rendered";
    const outputPath = `${outDir}\\${baseName}.pdf`;

    const result = await invoke<BackendConversionResult>("convert_markdown_to_pdf", {
      jobId,
      request: {
        inputPath: file.path,
        outputPath,
        theme: options.theme,
        pageSize: options.pageSize,
        margin: options.margin,
        orientation: options.orientation,
      },
    });

    return {
      outputPath: result.outputPath,
      outputFileName: extractFileName(result.outputPath),
      outputSizeFormatted: formatBytes(result.fileSizeBytes),
      durationMs: Number(result.durationMs),
      totalPages: result.totalPages,
      createdAt: new Date().toLocaleTimeString("id-ID"),
    };
  } catch (err) {
    throw parseBackendError(err);
  } finally {
    if (unlisten) unlisten();
  }
}
