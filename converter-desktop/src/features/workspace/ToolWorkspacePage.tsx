import React, { useEffect } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { TOOLS_CATALOG } from "@/data/tools";
import { useAppStore } from "@/stores/useAppStore";
import { useConversionStore } from "@/stores/useConversionStore";
import { FileDropzone } from "@/components/conversion/FileDropzone";
import { FileList } from "@/components/conversion/FileList";
import { ConversionOptionsPanel } from "@/components/conversion/ConversionOptionsPanel";
import { ProgressDisplay } from "@/components/conversion/ProgressDisplay";
import { ResultPanel } from "@/components/conversion/ResultPanel";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { pickDirectory } from "@/services/tauriConversionService";
import { toast } from "sonner";

export const ToolWorkspacePage: React.FC = () => {
  const { selectedToolId } = useAppStore();
  const tool =
    TOOLS_CATALOG.find((t) => t.id === selectedToolId) || TOOLS_CATALOG[0];

  const {
    files,
    status,
    progress,
    currentStage,
    result,
    error,
    optionsState,
    outputDir,
    setOutputDir,
    loadDefaultOutputDir,
    addFiles,
    removeFile,
    reorderFiles,
    clearFiles,
    initToolOptions,
    updateMergeOptions,
    updateSplitOptions,
    updateImageOptions,
    updateWordOptions,
    startConversion,
    cancelConversion,
    resetJob,
  } = useConversionStore();

  // Initialize options and default output dir
  useEffect(() => {
    initToolOptions(tool.id);
    if (!outputDir) {
      loadDefaultOutputDir();
    }
  }, [tool.id, initToolOptions, loadDefaultOutputDir, outputDir]);

  const handlePickOutputDir = async () => {
    try {
      const selected = await pickDirectory(outputDir || undefined);
      if (selected) {
        setOutputDir(selected);
        toast.success("Folder tujuan berhasil diubah", {
          description: selected,
        });
      }
    } catch (err: any) {
      toast.error("Gagal memilih folder", {
        description: err?.message || String(err),
      });
    }
  };

  const isProcessing = status === "processing" || status === "validating";
  const canReorder = tool.id === "merge-pdf" || tool.id === "image-to-pdf";
  const maxFiles =
    tool.id === "split-pdf" || tool.id === "word-to-pdf" ? 1 : undefined;

  return (
    <PageContainer>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Dropzone and Staged File List (2 cols on lg) */}
        <div className="lg:col-span-2 space-y-4">
          <FileDropzone
            acceptedFormats={tool.acceptedFormats}
            maxFiles={maxFiles}
            disabled={isProcessing}
            onFilesAccepted={addFiles}
          />

          <FileList
            files={files}
            canReorder={canReorder}
            disabled={isProcessing}
            onRemove={removeFile}
            onReorder={reorderFiles}
            onClearAll={clearFiles}
          />
        </div>

        {/* Right Column: Settings, Progress, and Result (1 col on lg) */}
        <div className="space-y-4">
          {/* Progress State */}
          {isProcessing && (
            <ProgressDisplay
              progress={progress}
              stage={currentStage}
              onCancel={cancelConversion}
            />
          )}

          {/* Result or Error State */}
          {(status === "success" || status === "error") && (
            <ResultPanel result={result} error={error} onReset={resetJob} />
          )}

          {/* Options Panel (Hidden during success to emphasize result) */}
          {status !== "success" && (
            <ConversionOptionsPanel
              toolId={tool.id}
              optionsState={optionsState}
              defaultOutputPath={outputDir || "Memuat folder default..."}
              disabled={isProcessing}
              onPickOutputDir={handlePickOutputDir}
              onUpdateMerge={updateMergeOptions}
              onUpdateSplit={updateSplitOptions}
              onUpdateImage={updateImageOptions}
              onUpdateWord={updateWordOptions}
            />
          )}

          {/* Action Trigger Button */}
          {status !== "success" && !isProcessing && (
            <Button
              size="lg"
              disabled={files.length === 0}
              onClick={() => startConversion(tool.id)}
              className="w-full text-xs font-semibold gap-2 shadow-md h-10 cursor-pointer"
            >
              <Play className="w-4 h-4" />
              Mulai Konversi {tool.name}
            </Button>
          )}
        </div>
      </div>
    </PageContainer>
  );
};
