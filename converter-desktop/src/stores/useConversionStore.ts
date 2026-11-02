import { create } from "zustand";
import {
  StagedFile,
  ToolOptionsState,
  ConversionStatus,
  MockConversionResult,
  ConversionError,
} from "@/types/conversion";
import { executeMockConversion, MockProcessController } from "@/services/mockConversionService";

interface ConversionStoreState {
  files: StagedFile[];
  status: ConversionStatus;
  progress: number;
  currentStage: string;
  result: MockConversionResult | null;
  error: ConversionError | null;
  controller: MockProcessController | null;

  // Options State
  optionsState: ToolOptionsState;

  // Actions
  addFiles: (newFiles: StagedFile[]) => void;
  removeFile: (id: string) => void;
  reorderFiles: (fromIndex: number, toIndex: number) => void;
  clearFiles: () => void;
  initToolOptions: (toolId: string) => void;
  updateMergeOptions: (opts: Partial<Extract<ToolOptionsState, { type: "merge-pdf" }>["options"]>) => void;
  updateSplitOptions: (opts: Partial<Extract<ToolOptionsState, { type: "split-pdf" }>["options"]>) => void;
  updateImageOptions: (opts: Partial<Extract<ToolOptionsState, { type: "image-to-pdf" }>["options"]>) => void;
  updateWordOptions: (opts: Partial<Extract<ToolOptionsState, { type: "word-to-pdf" }>["options"]>) => void;

  startConversion: (toolId: string) => void;
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
  controller: null,

  optionsState: {
    type: "merge-pdf",
    options: { outputFileName: "merged_document.pdf" },
  },

  addFiles: (newFiles) => {
    set((state) => ({
      files: [...state.files, ...newFiles],
      // If was in error or success, reset to idle
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

  startConversion: (toolId) => {
    const { files, optionsState } = get();

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

    // Enter validating stage
    set({
      status: "validating",
      progress: 5,
      currentStage: "Memvalidasi berkas input...",
      error: null,
      result: null,
    });

    const controller = executeMockConversion(
      toolId,
      files,
      optionsState,
      (percent, stage) => {
        set({
          status: "processing",
          progress: percent,
          currentStage: stage,
        });
      },
      (result) => {
        set({
          status: "success",
          progress: 100,
          currentStage: "Konversi Selesai",
          result,
          controller: null,
        });
      },
      (error) => {
        set({
          status: "error",
          currentStage: "Gagal",
          error,
          controller: null,
        });
      }
    );

    set({ controller });
  },

  cancelConversion: () => {
    const { controller } = get();
    if (controller) {
      controller.cancel();
    }
    set({
      status: "idle",
      progress: 0,
      currentStage: "Dibatalkan",
      controller: null,
    });
  },

  resetJob: () => {
    set({
      status: "idle",
      progress: 0,
      currentStage: "Siap",
      result: null,
      error: null,
      controller: null,
    });
  },
}));

