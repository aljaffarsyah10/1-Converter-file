import {
  StagedFile,
  ToolOptionsState,
  MockConversionResult,
  ConversionError,
} from "@/types/conversion";

/**
 * [MOCK CONVERSION SERVICE]
 *
 * Catatan penting untuk Phase 6:
 * Modul ini adalah MOCK SERVICE murni untuk menguji alur kerja frontend (loading, progress,
 * cancel, success, error) sebelum digantikan oleh IPC Tauri Command resmi pada Phase 8.
 * Layanan ini TIDAK menghasilkan berkas konversi nyata.
 */

export interface MockProcessController {
  cancel: () => void;
}

export function executeMockConversion(
  toolId: string,
  files: StagedFile[],
  optionsState: ToolOptionsState,
  onProgress: (percent: number, stage: string) => void,
  onSuccess: (result: MockConversionResult) => void,
  onError: (error: ConversionError) => void
): MockProcessController {
  let isCancelled = false;
  const startTime = Date.now();

  console.log(`[MOCK SERVICE] Starting simulated conversion for tool: ${toolId}`, {
    filesCount: files.length,
    options: optionsState,
  });

  // Client-side simulation validation
  if (toolId === "split-pdf" && optionsState.type === "split-pdf") {
    const range = optionsState.options.pageRange.trim();
    if (optionsState.options.splitMode === "extract_range") {
      // Validate range format (e.g. "1-3, 5")
      const validRangeRegex = /^(\d+(-\d+)?)(,\s*\d+(-\d+)?)*$/;
      if (!validRangeRegex.test(range)) {
        setTimeout(() => {
          onError({
            code: "INVALID_PAGE_RANGE",
            message: `Format rentang halaman "${range}" tidak valid.`,
            actionableHint: 'Gunakan format angka atau rentang seperti: "1-3, 5, 8-10".',
          });
        }, 300);

        return {
          cancel: () => {
            isCancelled = true;
          },
        };
      }
    }
  }

  // Multi-stage progression timeline simulation
  const stages = [
    { percent: 15, stage: "Memvalidasi struktur berkas input...", delay: 250 },
    { percent: 40, stage: "Memproses transformasi halaman...", delay: 500 },
    { percent: 75, stage: "Menyusun dan mengompresi stream output...", delay: 850 },
    { percent: 95, stage: "Menulis berkas ke direktori output...", delay: 1100 },
  ];

  const timeouts: ReturnType<typeof setTimeout>[] = [];

  stages.forEach(({ percent, stage, delay }) => {
    const t = setTimeout(() => {
      if (!isCancelled) {
        onProgress(percent, stage);
      }
    }, delay);
    timeouts.push(t);
  });

  const finalTimeout = setTimeout(() => {
    if (!isCancelled) {
      onProgress(100, "Selesai!");

      const durationMs = Date.now() - startTime;
      let outputFileName = "converted_result.pdf";

      if (optionsState.type === "merge-pdf") {
        outputFileName = optionsState.options.outputFileName || "merged_document.pdf";
      } else if (optionsState.type === "word-to-pdf") {
        outputFileName = optionsState.options.outputFileName || "document.pdf";
      } else if (optionsState.type === "image-to-pdf") {
        outputFileName = optionsState.options.outputFileName || "images_document.pdf";
      } else if (optionsState.type === "split-pdf") {
        outputFileName = `${optionsState.options.outputPrefix}_page_1.pdf`;
      }

      onSuccess({
        outputPath: `C:/Users/User/Downloads/Converted/${outputFileName}`,
        outputFileName,
        outputSizeFormatted: `${(Math.random() * 1.5 + 0.3).toFixed(2)} MB`,
        durationMs,
        totalPages: files.length > 1 ? files.length * 2 : 3,
        createdAt: new Date().toLocaleTimeString(),
      });
    }
  }, 1350);
  timeouts.push(finalTimeout);

  return {
    cancel: () => {
      isCancelled = true;
      timeouts.forEach(clearTimeout);
      console.log(`[MOCK SERVICE] Job cancelled by user`);
    },
  };
}
