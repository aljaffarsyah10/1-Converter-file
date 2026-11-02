import { create } from "zustand";
import {
  StagedFile,
  ToolOptionsState,
  ConversionStatus,
  ConversionResult,
  ConversionError,
} from "@/types/conversion";
import {
  executeTauriMergePdf,
  executeTauriSplitPdf,
  executeTauriImageToPdf,
  executeTauriWordToPdf,
  executeTauriPdfToWord,
  executeTauriPdfToImage,
  executeTauriCompressPdf,
  executeTauriExcelToPdf,
  executeTauriPptxToPdf,
  executeTauriPdfToExcel,
  executeTauriProtectPdf,
  executeTauriRotatePdf,
  executeTauriUnlockPdf,
  executeTauriWatermarkPdf,
  executeTauriCompressImage,
  executeTauriConvertImage,
  executeTauriResizeImage,
  executeTauriHtmlToPdf,
  executeTauriMarkdownToPdf,
  getDefaultOutputDir,
} from "@/services/tauriConversionService";

interface ConversionStoreState {
  files: StagedFile[];
  status: ConversionStatus;
  progress: number;
  currentStage: string;
  result: ConversionResult | null;
  error: ConversionError | null;
  outputDir: string;

  // Options State
  optionsState: ToolOptionsState;

  // Actions
  setOutputDir: (dir: string) => void;
  loadDefaultOutputDir: () => Promise<void>;
  addFiles: (newFiles: StagedFile[]) => void;
  removeFile: (id: string) => void;
  reorderFiles: (fromIndex: number, toIndex: number) => void;
  clearFiles: () => void;
  initToolOptions: (toolId: string) => void;
  updateMergeOptions: (
    opts: Partial<Extract<ToolOptionsState, { type: "merge-pdf" }>["options"]>,
  ) => void;
  updateSplitOptions: (
    opts: Partial<Extract<ToolOptionsState, { type: "split-pdf" }>["options"]>,
  ) => void;
  updateImageOptions: (
    opts: Partial<
      Extract<ToolOptionsState, { type: "image-to-pdf" }>["options"]
    >,
  ) => void;
  updateWordOptions: (
    opts: Partial<
      Extract<ToolOptionsState, { type: "word-to-pdf" }>["options"]
    >,
  ) => void;
  updatePdfToWordOptions: (
    opts: Partial<
      Extract<ToolOptionsState, { type: "pdf-to-word" }>["options"]
    >,
  ) => void;
  updatePdfToImageOptions: (
    opts: Partial<
      Extract<ToolOptionsState, { type: "pdf-to-image" }>["options"]
    >,
  ) => void;
  updateCompressPdfOptions: (
    opts: Partial<
      Extract<ToolOptionsState, { type: "compress-pdf" }>["options"]
    >,
  ) => void;
  updateExcelOptions: (
    opts: Partial<
      Extract<ToolOptionsState, { type: "excel-to-pdf" }>["options"]
    >,
  ) => void;
  updatePptxOptions: (
    opts: Partial<
      Extract<ToolOptionsState, { type: "pptx-to-pdf" }>["options"]
    >,
  ) => void;
  updatePdfToExcelOptions: (
    opts: Partial<
      Extract<ToolOptionsState, { type: "pdf-to-excel" }>["options"]
    >,
  ) => void;
  updateRotateOptions: (
    opts: Partial<
      Extract<ToolOptionsState, { type: "rotate-pdf" }>["options"]
    >,
  ) => void;

    updateProtectOptions: (
    opts: Partial<
      Extract<ToolOptionsState, { type: "protect-pdf" }>["options"]
    >,
  ) => void;
  updateUnlockOptions: (
    opts: Partial<
      Extract<ToolOptionsState, { type: "unlock-pdf" }>["options"]
    >,
  ) => void;

    updateWatermarkOptions: (
    opts: Partial<
      Extract<ToolOptionsState, { type: "watermark-pdf" }>["options"]
    >,
  ) => void;

    updateCompressImageOptions: (
    opts: Partial<
      Extract<ToolOptionsState, { type: "image-compress" }>["options"]
    >,
  ) => void;
  updateConvertImageOptions: (
    opts: Partial<
      Extract<ToolOptionsState, { type: "image-convert" }>["options"]
    >,
  ) => void;
  updateResizeImageOptions: (
    opts: Partial<
      Extract<ToolOptionsState, { type: "image-resize" }>["options"]
    >,
  ) => void;

    updateHtmlToPdfOptions: (
    opts: Partial<
      Extract<ToolOptionsState, { type: "html-to-pdf" }>["options"]
    >,
  ) => void;

  updateMarkdownToPdfOptions: (
    opts: Partial<
      Extract<ToolOptionsState, { type: "markdown-to-pdf" }>["options"]
    >,
  ) => void;

  startConversion: (toolId: string) => Promise<void>;
  cancelConversion: () => void;
  resetJob: () => void;
}

export const useConversionStore = create<ConversionStoreState>((set, get) => ({
  files: [],
  status: "idle",
  progress: 0,
  currentStage: "Siap",
  result: null,
  error: null,
  outputDir: "",

  optionsState: {
    type: "merge-pdf",
    options: { outputFileName: "merged_document.pdf" },
  },

  setOutputDir: (dir: string) => set({ outputDir: dir }),

  loadDefaultOutputDir: async () => {
    try {
      const dir = await getDefaultOutputDir();
      if (dir) {
        set({ outputDir: dir });
      }
    } catch (err) {
      console.warn("Failed to load default output directory:", err);
    }
  },

  addFiles: (newFiles) => {
    set((state) => ({
      files: [...state.files, ...newFiles],
      status:
        state.status === "success" || state.status === "error"
          ? "idle"
          : state.status,
      result: null,
      error: null,
    }));
  },

  removeFile: (id) => {
    set((state) => ({
      files: state.files.filter((f) => f.id !== id),
    }));
  },

  reorderFiles: (fromIndex, toIndex) => {
    set((state) => {
      const updated = [...state.files];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return { files: updated };
    });
  },

  clearFiles: () => {
    set({ files: [], status: "idle", result: null, error: null });
  },

  initToolOptions: (toolId) => {
    let optionsState: ToolOptionsState;
    switch (toolId) {
      case "merge-pdf":
        optionsState = {
          type: "merge-pdf",
          options: { outputFileName: "merged_document.pdf" },
        };
        break;
      case "split-pdf":
        optionsState = {
          type: "split-pdf",
          options: {
            splitMode: "extract_range",
            pageRange: "1-2",
            outputPrefix: "split_document",
          },
        };
        break;
      case "image-to-pdf":
        optionsState = {
          type: "image-to-pdf",
          options: {
            orientation: "auto",
            pageSize: "A4",
            margin: "small",
            outputFileName: "converted_images.pdf",
          },
        };
        break;
      case "word-to-pdf":
        optionsState = {
          type: "word-to-pdf",
          options: {
            outputFileName: "converted_document.pdf",
            openAfterConvert: true,
          },
        };
        break;
      case "pdf-to-word":
        optionsState = {
          type: "pdf-to-word",
          options: {
            outputFileName: "converted_document.docx",
            openAfterConvert: true,
          },
        };
        break;
      case "pdf-to-image":
        optionsState = {
          type: "pdf-to-image",
          options: {
            outputPrefix: "page",
            format: "png",
            dpi: 150,
            pageRange: "",
          },
        };
        break;
      case "compress-pdf":
        optionsState = {
          type: "compress-pdf",
          options: {
            outputFileName: "compressed_document.pdf",
            level: "medium",
          },
        };
        break;
      case "excel-to-pdf":
        optionsState = {
          type: "excel-to-pdf",
          options: {
            outputFileName: "converted_spreadsheet.pdf",
            openAfterConvert: true,
          },
        };
        break;
      case "pptx-to-pdf":
        optionsState = {
          type: "pptx-to-pdf",
          options: {
            outputFileName: "converted_presentation.pdf",
            openAfterConvert: true,
          },
        };
        break;
      case "pdf-to-excel":
        optionsState = {
          type: "pdf-to-excel",
          options: {
            outputFileName: "extracted_tables.xlsx",
            openAfterConvert: true,
          },
        };
        break;
      case "rotate-pdf":
        optionsState = {
          type: "rotate-pdf",
          options: {
            outputFileName: "rotated_document.pdf",
            angle: 90,
            pageRange: "",
          },
        };
        break;
            case "protect-pdf":
        optionsState = {
          type: "protect-pdf",
          options: {
            outputFileName: "protected_document.pdf",
            password: "",
            confirmPassword: "",
          },
        };
        break;
      case "unlock-pdf":
        optionsState = {
          type: "unlock-pdf",
          options: {
            outputFileName: "unlocked_document.pdf",
            password: "",
          },
        };
        break;
            case "watermark-pdf":
        optionsState = {
          type: "watermark-pdf",
          options: {
            outputFileName: "watermarked_document.pdf",
            text: "CONFIDENTIAL",
            fontSize: "medium",
            opacity: "25",
            position: "diagonal",
            color: "#888888",
          },
        };
        break;
            case "image-compress":
        optionsState = {
          type: "image-compress",
          options: {
            outputFileName: "compressed_image",
            level: "medium",
          },
        };
        break;
      case "image-convert":
        optionsState = {
          type: "image-convert",
          options: {
            outputFileName: "converted_image",
            targetFormat: "png",
          },
        };
        break;
      case "image-resize":
        optionsState = {
          type: "image-resize",
          options: {
            outputFileName: "resized_image",
            resizeMode: "percentage",
            scalePercent: 50,
            maintainAspectRatio: true,
          },
        };
        break;
            case "html-to-pdf":
        optionsState = {
          type: "html-to-pdf",
          options: {
            outputFileName: "rendered_document.pdf",
            pageSize: "A4",
            margin: "normal",
            orientation: "portrait",
          },
        };
        break;
      case "markdown-to-pdf":
        optionsState = {
          type: "markdown-to-pdf",
          options: {
            outputFileName: "rendered_markdown.pdf",
            theme: "github",
            pageSize: "A4",
            margin: "normal",
            orientation: "portrait",
          },
        };
        break;
      default:
        optionsState = {
          type: "merge-pdf",
          options: { outputFileName: "output.pdf" },
        };
    }

    set({
      optionsState,
      status: "idle",
      progress: 0,
      currentStage: "Siap",
      result: null,
      error: null,
    });
  },

  updateMergeOptions: (opts) => {
    set((state) => {
      if (state.optionsState.type !== "merge-pdf") return state;
      return {
        optionsState: {
          ...state.optionsState,
          options: { ...state.optionsState.options, ...opts },
        },
      };
    });
  },

  updateSplitOptions: (opts) => {
    set((state) => {
      if (state.optionsState.type !== "split-pdf") return state;
      return {
        optionsState: {
          ...state.optionsState,
          options: { ...state.optionsState.options, ...opts },
        },
      };
    });
  },

  updateImageOptions: (opts) => {
    set((state) => {
      if (state.optionsState.type !== "image-to-pdf") return state;
      return {
        optionsState: {
          ...state.optionsState,
          options: { ...state.optionsState.options, ...opts },
        },
      };
    });
  },

  updateWordOptions: (opts) => {
    set((state) => {
      if (state.optionsState.type !== "word-to-pdf") return state;
      return {
        optionsState: {
          ...state.optionsState,
          options: { ...state.optionsState.options, ...opts },
        },
      };
    });
  },

  updatePdfToWordOptions: (opts) => {
    set((state) => {
      if (state.optionsState.type !== "pdf-to-word") return state;
      return {
        optionsState: {
          ...state.optionsState,
          options: { ...state.optionsState.options, ...opts },
        },
      };
    });
  },

  updatePdfToImageOptions: (opts) => {
    set((state) => {
      if (state.optionsState.type !== "pdf-to-image") return state;
      return {
        optionsState: {
          ...state.optionsState,
          options: { ...state.optionsState.options, ...opts },
        },
      };
    });
  },

  updateCompressPdfOptions: (opts) => {
    set((state) => {
      if (state.optionsState.type !== "compress-pdf") return state;
      return {
        optionsState: {
          ...state.optionsState,
          options: { ...state.optionsState.options, ...opts },
        },
      };
    });
  },

  updateExcelOptions: (opts) => {
    set((state) => {
      if (state.optionsState.type !== "excel-to-pdf") return state;
      return {
        optionsState: {
          ...state.optionsState,
          options: { ...state.optionsState.options, ...opts },
        },
      };
    });
  },

  updatePptxOptions: (opts) => {
    set((state) => {
      if (state.optionsState.type !== "pptx-to-pdf") return state;
      return {
        optionsState: {
          ...state.optionsState,
          options: { ...state.optionsState.options, ...opts },
        },
      };
    });
  },

  updatePdfToExcelOptions: (opts) => {
    set((state) => {
      if (state.optionsState.type !== "pdf-to-excel") return state;
      return {
        optionsState: {
          ...state.optionsState,
          options: { ...state.optionsState.options, ...opts },
        },
      };
    });
  },

  updateRotateOptions: (opts) => {
    set((state) => {
      if (state.optionsState.type !== "rotate-pdf") return state;
      return {
        optionsState: {
          ...state.optionsState,
          options: { ...state.optionsState.options, ...opts },
        },
      };
    });
  },

  
  updateProtectOptions: (opts) => {
    set((state) => {
      if (state.optionsState.type !== "protect-pdf") return state;
      return {
        optionsState: {
          ...state.optionsState,
          options: { ...state.optionsState.options, ...opts },
        },
      };
    });
  },

  updateUnlockOptions: (opts) => {
    set((state) => {
      if (state.optionsState.type !== "unlock-pdf") return state;
      return {
        optionsState: {
          ...state.optionsState,
          options: { ...state.optionsState.options, ...opts },
        },
      };
    });
  },

  
  updateWatermarkOptions: (opts) => {
    set((state) => {
      if (state.optionsState.type !== "watermark-pdf") return state;
      return {
        optionsState: {
          ...state.optionsState,
          options: { ...state.optionsState.options, ...opts },
        },
      };
    });
  },

  
  updateCompressImageOptions: (opts) => {
    set((state) => {
      if (state.optionsState.type !== "image-compress") return state;
      return {
        optionsState: {
          ...state.optionsState,
          options: { ...state.optionsState.options, ...opts },
        },
      };
    });
  },

  updateConvertImageOptions: (opts) => {
    set((state) => {
      if (state.optionsState.type !== "image-convert") return state;
      return {
        optionsState: {
          ...state.optionsState,
          options: { ...state.optionsState.options, ...opts },
        },
      };
    });
  },

  updateResizeImageOptions: (opts) => {
    set((state) => {
      if (state.optionsState.type !== "image-resize") return state;
      return {
        optionsState: {
          ...state.optionsState,
          options: { ...state.optionsState.options, ...opts },
        },
      };
    });
  },

  
  updateHtmlToPdfOptions: (opts) => {
    set((state) => {
      if (state.optionsState.type !== "html-to-pdf") return state;
      return {
        optionsState: {
          ...state.optionsState,
          options: { ...state.optionsState.options, ...opts },
        },
      };
    });
  },

  updateMarkdownToPdfOptions: (opts) => {
    set((state) => {
      if (state.optionsState.type !== "markdown-to-pdf") return state;
      return {
        optionsState: {
          ...state.optionsState,
          options: { ...state.optionsState.options, ...opts },
        },
      };
    });
  },

  startConversion: async (toolId) => {
    const { files, optionsState, status, outputDir } = get();

    // Prevent duplicate calls
    if (status === "validating" || status === "processing") {
      return;
    }

    if (files.length === 0) {
      set({
        status: "error",
        error: {
          code: "NO_FILES",
          message: "Tidak ada berkas yang dipilih.",
          actionableHint: "Tambahkan berkas terlebih dahulu melalui dropzone.",
        },
      });
      return;
    }

    
    if (toolId === "protect-pdf") {
      const opts = optionsState.type === "protect-pdf" ? optionsState.options : null;
      if (!opts?.password || opts.password.trim().length === 0) {
        set({
          status: "error",
          error: {
            code: "EMPTY_PASSWORD",
            message: "Kata sandi tidak boleh kosong.",
            actionableHint: "Masukkan kata sandi untuk melindungi berkas PDF.",
          },
        });
        return;
      }
      if (opts.confirmPassword !== undefined && opts.confirmPassword !== "" && opts.confirmPassword !== opts.password) {
        set({
          status: "error",
          error: {
            code: "PASSWORD_MISMATCH",
            message: "Konfirmasi kata sandi tidak cocok.",
            actionableHint: "Pastikan kata sandi dan konfirmasi kata sandi sama persis.",
          },
        });
        return;
      }
    }

    if (toolId === "unlock-pdf") {
      const opts = optionsState.type === "unlock-pdf" ? optionsState.options : null;
      if (!opts?.password || opts.password.trim().length === 0) {
        set({
          status: "error",
          error: {
            code: "EMPTY_PASSWORD",
            message: "Kata sandi tidak boleh kosong.",
            actionableHint: "Masukkan kata sandi pembuka untuk berkas PDF.",
          },
        });
        return;
      }
    }

    
    if (toolId === "watermark-pdf") {
      const opts = optionsState.type === "watermark-pdf" ? optionsState.options : null;
      if (!opts?.text || opts.text.trim().length === 0) {
        set({
          status: "error",
          error: {
            code: "EMPTY_WATERMARK_TEXT",
            message: "Teks watermark tidak boleh kosong.",
            actionableHint: "Masukkan teks yang ingin dijadikan watermark pada dokumen PDF.",
          },
        });
        return;
      }
    }

    if (toolId === "merge-pdf" && files.length < 2) {
      set({
        status: "error",
        error: {
          code: "TOO_FEW_FILES",
          message: "Penggabungan PDF membutuhkan minimal 2 berkas.",
          actionableHint: "Pilih setidaknya 2 berkas PDF untuk digabungkan.",
        },
      });
      return;
    }

    // Verify all files have valid paths
    const invalidFile = files.find((f) => !f.path || f.path.trim() === "");
    if (invalidFile) {
      set({
        status: "error",
        error: {
          code: "INVALID_PATH",
          message: `Berkas "${invalidFile.name}" tidak memiliki path absolut pada filesystem.`,
          actionableHint:
            "Gunakan tombol 'Pilih Berkas' untuk memilih berkas dari sistem.",
        },
      });
      return;
    }

    // Enter validating stage
    set({
      status: "validating",
      progress: 5,
      currentStage: "Memvalidasi berkas input...",
      error: null,
      result: null,
    });

    const onProgress = (percent: number, stage: string) => {
      set({
        status: "processing",
        progress: percent,
        currentStage: stage,
      });
    };

    try {
      let res: ConversionResult;

      switch (toolId) {
        case "merge-pdf": {
          const opts =
            optionsState.type === "merge-pdf"
              ? optionsState.options
              : { outputFileName: "merged_document.pdf" };
          res = await executeTauriMergePdf(
            files,
            { ...opts, outputDir: outputDir || undefined },
            onProgress,
          );
          break;
        }
        case "split-pdf": {
          const opts =
            optionsState.type === "split-pdf"
              ? optionsState.options
              : {
                  splitMode: "extract_range" as const,
                  pageRange: "1-2",
                  outputPrefix: "split_document",
                };
          res = await executeTauriSplitPdf(
            files[0],
            { ...opts, outputDir: outputDir || undefined },
            onProgress,
          );
          break;
        }
        case "image-to-pdf": {
          const opts =
            optionsState.type === "image-to-pdf"
              ? optionsState.options
              : {
                  orientation: "auto" as const,
                  pageSize: "A4" as const,
                  margin: "small" as const,
                  outputFileName: "converted_images.pdf",
                };
          res = await executeTauriImageToPdf(
            files,
            { ...opts, outputDir: outputDir || undefined },
            onProgress,
          );
          break;
        }
        case "word-to-pdf": {
          const opts =
            optionsState.type === "word-to-pdf"
              ? optionsState.options
              : {
                  outputFileName: "converted_document.pdf",
                  openAfterConvert: true,
                };
          res = await executeTauriWordToPdf(
            files[0],
            { ...opts, outputDir: outputDir || undefined },
            onProgress,
          );
          break;
        }
        case "pdf-to-word": {
          const opts =
            optionsState.type === "pdf-to-word"
              ? optionsState.options
              : {
                  outputFileName: "converted_document.docx",
                  openAfterConvert: true,
                };
          res = await executeTauriPdfToWord(
            files[0],
            { ...opts, outputDir: outputDir || undefined },
            onProgress,
          );
          break;
        }
        case "pdf-to-image": {
          const opts =
            optionsState.type === "pdf-to-image"
              ? optionsState.options
              : {
                  outputPrefix: "page",
                  format: "png" as const,
                  dpi: 150 as const,
                  pageRange: "",
                };
          res = await executeTauriPdfToImage(
            files[0],
            { ...opts, outputDir: outputDir || undefined },
            onProgress,
          );
          break;
        }
        case "compress-pdf": {
          const opts =
            optionsState.type === "compress-pdf"
              ? optionsState.options
              : {
                  outputFileName: "compressed_document.pdf",
                  level: "medium" as const,
                };
          res = await executeTauriCompressPdf(
            files[0],
            { ...opts, outputDir: outputDir || undefined },
            onProgress,
          );
          break;
        }
        case "excel-to-pdf": {
          const opts =
            optionsState.type === "excel-to-pdf"
              ? optionsState.options
              : {
                  outputFileName: "converted_spreadsheet.pdf",
                  openAfterConvert: true,
                };
          res = await executeTauriExcelToPdf(
            files[0],
            { ...opts, outputDir: outputDir || undefined },
            onProgress,
          );
          break;
        }
        case "pptx-to-pdf": {
          const opts =
            optionsState.type === "pptx-to-pdf"
              ? optionsState.options
              : {
                  outputFileName: "converted_presentation.pdf",
                  openAfterConvert: true,
                };
          res = await executeTauriPptxToPdf(
            files[0],
            { ...opts, outputDir: outputDir || undefined },
            onProgress,
          );
          break;
        }
        case "pdf-to-excel": {
          const opts =
            optionsState.type === "pdf-to-excel"
              ? optionsState.options
              : {
                  outputFileName: "extracted_tables.xlsx",
                  openAfterConvert: true,
                };
          res = await executeTauriPdfToExcel(
            files[0],
            { ...opts, outputDir: outputDir || undefined },
            onProgress,
          );
          break;
        }
        case "rotate-pdf": {
          const opts =
            optionsState.type === "rotate-pdf"
              ? optionsState.options
              : {
                  outputFileName: "rotated_document.pdf",
                  angle: 90 as const,
                  pageRange: "",
                };
          res = await executeTauriRotatePdf(
            files[0],
            { ...opts, outputDir: outputDir || undefined },
            onProgress,
          );
          break;
        }
                case "protect-pdf": {
          const opts =
            optionsState.type === "protect-pdf"
              ? optionsState.options
              : {
                  outputFileName: "protected_document.pdf",
                  password: "",
                };
          res = await executeTauriProtectPdf(
            files[0],
            { ...opts, outputDir: outputDir || undefined },
            onProgress,
          );
          break;
        }
        case "unlock-pdf": {
          const opts =
            optionsState.type === "unlock-pdf"
              ? optionsState.options
              : {
                  outputFileName: "unlocked_document.pdf",
                  password: "",
                };
          res = await executeTauriUnlockPdf(
            files[0],
            { ...opts, outputDir: outputDir || undefined },
            onProgress,
          );
          break;
        }
                case "watermark-pdf": {
          const opts =
            optionsState.type === "watermark-pdf"
              ? optionsState.options
              : {
                  outputFileName: "watermarked_document.pdf",
                  text: "CONFIDENTIAL",
                  fontSize: "medium" as const,
                  opacity: "25" as const,
                  position: "diagonal" as const,
                };
          res = await executeTauriWatermarkPdf(
            files[0],
            { ...opts, outputDir: outputDir || undefined },
            onProgress,
          );
          break;
        }
                case "image-compress": {
          const opts =
            optionsState.type === "image-compress"
              ? optionsState.options
              : {
                  outputFileName: "compressed_image",
                  level: "medium" as const,
                };
          res = await executeTauriCompressImage(
            files[0],
            { ...opts, outputDir: outputDir || undefined },
            onProgress,
          );
          break;
        }
        case "image-convert": {
          const opts =
            optionsState.type === "image-convert"
              ? optionsState.options
              : {
                  outputFileName: "converted_image",
                  targetFormat: "png" as const,
                };
          res = await executeTauriConvertImage(
            files[0],
            { ...opts, outputDir: outputDir || undefined },
            onProgress,
          );
          break;
        }
        case "image-resize": {
          const opts =
            optionsState.type === "image-resize"
              ? optionsState.options
              : {
                  outputFileName: "resized_image",
                  resizeMode: "percentage" as const,
                  scalePercent: 50,
                  maintainAspectRatio: true,
                };
          res = await executeTauriResizeImage(
            files[0],
            { ...opts, outputDir: outputDir || undefined },
            onProgress,
          );
          break;
        }
                case "html-to-pdf": {
          const opts =
            optionsState.type === "html-to-pdf"
              ? optionsState.options
              : {
                  outputFileName: "rendered_document.pdf",
                  pageSize: "A4" as const,
                  margin: "normal" as const,
                  orientation: "portrait" as const,
                };
          res = await executeTauriHtmlToPdf(
            files[0],
            { ...opts, outputDir: outputDir || undefined },
            onProgress,
          );
          break;
        }
        case "markdown-to-pdf": {
          const opts =
            optionsState.type === "markdown-to-pdf"
              ? optionsState.options
              : {
                  outputFileName: "rendered_markdown.pdf",
                  theme: "github" as const,
                  pageSize: "A4" as const,
                  margin: "normal" as const,
                  orientation: "portrait" as const,
                };
          res = await executeTauriMarkdownToPdf(
            files[0],
            { ...opts, outputDir: outputDir || undefined },
            onProgress,
          );
          break;
        }
        default:
          throw new Error(`Tool "${toolId}" tidak dikenali.`);
      }

      set({
        status: "success",
        progress: 100,
        currentStage: "Konversi Selesai",
        result: res,
      });
    } catch (err: any) {
      set({
        status: "error",
        currentStage: "Gagal",
        error: {
          code: err.code || "CONVERSION_ERROR",
          message: err.message || "Gagal melakukan konversi berkas.",
          actionableHint:
            err.actionableHint || "Periksa kembali berkas dan izin direktori.",
        },
      });
    }
  },

  cancelConversion: () => {
    set({
      status: "idle",
      progress: 0,
      currentStage: "Dibatalkan",
    });
  },

  resetJob: () => {
    set({
      status: "idle",
      progress: 0,
      currentStage: "Siap",
      result: null,
      error: null,
    });
  },
}));
