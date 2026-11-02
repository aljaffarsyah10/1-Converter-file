import React, { useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { TOOLS_CATALOG } from "@/data/tools";
import { useAppStore } from "@/stores/useAppStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  UploadCloud,
  File as FileIcon,
  X,
  Play,
  CheckCircle2,
  FolderOpen,
  Settings2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

export const ToolWorkspacePage: React.FC = () => {
  const { selectedToolId, defaultOutputPath } = useAppStore();
  const tool = TOOLS_CATALOG.find((t) => t.id === selectedToolId) || TOOLS_CATALOG[0];

  // Dummy files state for UI layout demonstration
  const [dummyFiles, setDummyFiles] = useState<Array<{ name: string; size: string }>>([
    { name: `example_input_1${tool.acceptedFormats[0]}`, size: "1.4 MB" },
    ...(tool.id === "merge-pdf"
      ? [{ name: "example_input_2.pdf", size: "820 KB" }]
      : []),
  ]);

  const [outputName, setOutputName] = useState(`converted_result.${tool.outputFormat.toLowerCase()}`);
  const [status, setStatus] = useState<"ready" | "processing" | "completed">("ready");
  const [progress, setProgress] = useState(0);

  // Simulated conversion preview for UI shell verification
  const handleSimulateProcess = () => {
    if (dummyFiles.length === 0) {
      toast.error("Please add at least one file");
      return;
    }

    setStatus("processing");
    setProgress(15);

    const timer1 = setTimeout(() => setProgress(60), 600);
    const timer2 = setTimeout(() => {
      setProgress(100);
      setStatus("completed");
      toast.success("Conversion completed (UI Preview Mode)", {
        description: `Simulated output ready at ${defaultOutputPath}/${outputName}`,
      });
    }, 1200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  };

  const handleReset = () => {
    setStatus("ready");
    setProgress(0);
  };

  const removeFile = (index: number) => {
    setDummyFiles((prev) => prev.filter((_, i) => i !== index));
    toast.info("File removed from list");
  };

  return (
    <PageContainer>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: File Dropzone & File List (2 cols on lg) */}
        <div className="lg:col-span-2 space-y-4">
          {/* File Dropzone Area */}
          <div className="border-2 border-dashed rounded-xl p-8 bg-card flex flex-col items-center justify-center text-center transition-colors hover:border-primary/50">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold tracking-tight">
              Drag & Drop files here, or click to browse
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              Supports {tool.acceptedFormats.join(", ")} files. Processed locally.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 text-xs"
              onClick={() => {
                setDummyFiles((prev) => [
                  ...prev,
                  {
                    name: `sample_file_${prev.length + 1}${tool.acceptedFormats[0]}`,
                    size: "950 KB",
                  },
                ]);
                toast("Sample file added to workspace");
              }}
            >
              + Add Sample File
            </Button>
          </div>

          {/* Selected Files List */}
          <Card>
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b">
              <div>
                <CardTitle className="text-sm font-semibold">
                  Input Files ({dummyFiles.length})
                </CardTitle>
                <CardDescription className="text-xs">
                  Files staged for conversion
                </CardDescription>
              </div>
              {dummyFiles.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDummyFiles([])}
                  className="text-xs text-destructive hover:text-destructive h-7"
                >
                  Clear All
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-3 divide-y">
              {dummyFiles.length > 0 ? (
                dummyFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="py-2.5 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <FileIcon className="w-4 h-4 text-primary shrink-0" />
                      <span className="font-medium truncate">{file.name}</span>
                      <span className="text-[11px] text-muted-foreground shrink-0 font-mono">
                        ({file.size})
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={() => removeFile(idx)}
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))
              ) : (
                <p className="py-6 text-center text-xs text-muted-foreground">
                  No files added yet. Drop files above or click Add Sample File.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Settings & Process Panel (1 col on lg) */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="py-4 px-5 border-b">
              <div className="flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-primary" />
                <CardTitle className="text-sm font-semibold">
                  Conversion Settings
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {/* Output Name Setting */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Output File Name
                </label>
                <Input
                  value={outputName}
                  onChange={(e) => setOutputName(e.target.value)}
                  className="text-xs h-8"
                  placeholder="result.pdf"
                />
              </div>

              {/* Destination Folder Setting */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Destination Directory
                </label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={defaultOutputPath}
                    className="text-xs h-8 bg-muted font-mono"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    title="Change output folder"
                    onClick={() => toast("Folder picker available in integrated backend")}
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* Tool specific settings mock */}
              {tool.id === "split-pdf" && (
                <div className="space-y-1.5 pt-2 border-t">
                  <label className="text-xs font-medium text-foreground">
                    Page Range (e.g. 1-3, 5)
                  </label>
                  <Input defaultValue="All pages" className="text-xs h-8" />
                </div>
              )}

              {/* Progress Bar (if processing or completed) */}
              {status !== "ready" && (
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{status === "processing" ? "Processing..." : "Done!"}</span>
                    <span className="font-mono">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                {status === "completed" ? (
                  <div className="space-y-2">
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Result file successfully created</span>
                    </div>
                    <Button
                      onClick={handleReset}
                      variant="outline"
                      size="sm"
                      className="w-full text-xs gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Convert Another File
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={handleSimulateProcess}
                    disabled={status === "processing" || dummyFiles.length === 0}
                    className="w-full text-xs font-medium gap-1.5 shadow"
                  >
                    <Play className="w-3.5 h-3.5" />
                    {status === "processing" ? "Converting..." : "Start Conversion"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
};

