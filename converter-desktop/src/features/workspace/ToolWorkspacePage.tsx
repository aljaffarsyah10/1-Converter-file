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
import { Play, Sparkles } from "lucide-react";

export const ToolWorkspacePage: React.FC = () => {
  const { selectedToolId, defaultOutputPath } = useAppStore();
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

  // Initialize options whenever toolId changes
  useEffect(() => {
    initToolOptions(tool.id);
  }, [tool.id, initToolOptions]);

  const isProcessing = status === "processing" || status === "validating";
  const canReorder = tool.id === "merge-pdf" || tool.id === "image-to-pdf";
  const maxFiles = tool.id === "split-pdf" || tool.id === "word-to-pdf" ? 1 : undefined;

  return (
    <PageContainer>
      {/* Mock Workflow Banner notice */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-primary font-medium">
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>
            Mode Simulasi UI (Phase 6): Alur validasi, pemilihan berkas, progres, dan state hasil aktif menggunakan Mock Service.
          </span>
        </div>
        <span className="font-mono text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded uppercase font-bold">
          Mock Active
        </span>
      </div>

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
              defaultOutputPath={defaultOutputPath}
              disabled={isProcessing}
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
              className="w-full text-xs font-semibold gap-2 shadow-md h-10"
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
