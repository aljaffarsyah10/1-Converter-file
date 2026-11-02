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
  updateMergeOptions: (opts: Partial<Extract<ToolOptionsState, { type: "merge-pdf" }>["options"]>) => void;
  updateSplitOptions: (opts: Partial<Extract<ToolOptionsState, { type: "split-pdf" }>["options"]>) => void;
  updateImageOptions: (opts: Partial<Extract<ToolOptionsState, { type: "image-to-pdf" }>["options"]>) => void;
  updateWordOptions: (opts: Partial<Extract<ToolOptionsState, { type: "word-to-pdf" }>["options"]>) => void;
  updatePdfToWordOptions: (opts: Partial<Extract<ToolOptionsState, { type: "pdf-to-word" }>["options"]>) => void;
  updatePdfToImageOptions: (opts: Partial<Extract<ToolOptionsState, { type: "pdf-to-image" }>["options"]>) => void;
  updateCompressPdfOptions: (opts: Partial<Extract<ToolOptionsState, { type: "compress-pdf" }>["options"]>) => void;
  updateExcelOptions: (opts: Partial<Extract<ToolOptionsState, { type: "excel-to-pdf" }>["options"]>) => void;
  updatePptxOptions: (opts: Partial<Extract<ToolOptionsState, { type: "pptx-to-pdf" }>["options"]>) => void;

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
      status: state.status === "success" || state.status === "error" ? "idle" : state.status,
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
          actionableHint: "Gunakan tombol 'Pilih Berkas' untuk memilih berkas dari sistem.",
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
            onProgress
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
            onProgress
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
            onProgress
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
            onProgress
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
            onProgress
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
            onProgress
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
            onProgress
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
            onProgress
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
            onProgress
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
          actionableHint: err.actionableHint || "Periksa kembali berkas dan izin direktori.",
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
