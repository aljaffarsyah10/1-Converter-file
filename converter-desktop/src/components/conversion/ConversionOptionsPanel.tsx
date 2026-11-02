import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ToolOptionsState } from "@/types/conversion";
import { Settings2, FolderOpen, AlertCircle } from "lucide-react";

interface ConversionOptionsPanelProps {
  toolId: string;
  optionsState: ToolOptionsState;
  defaultOutputPath: string;
  disabled?: boolean;
  onPickOutputDir?: () => void;
  onUpdateMerge: (opts: { outputFileName: string }) => void;
  onUpdateSplit: (opts: { splitMode?: "extract_range" | "split_all"; pageRange?: string; outputPrefix?: string }) => void;
  onUpdateImage: (opts: { orientation?: "auto" | "portrait" | "landscape"; pageSize?: "A4" | "FitImage"; margin?: "none" | "small" | "normal"; outputFileName?: string }) => void;
  onUpdateWord: (opts: { outputFileName?: string; openAfterConvert?: boolean }) => void;
}

export const ConversionOptionsPanel: React.FC<ConversionOptionsPanelProps> = ({
  toolId,
  optionsState,
  defaultOutputPath,
  disabled = false,
  onPickOutputDir,
  onUpdateMerge,
  onUpdateSplit,
  onUpdateImage,
  onUpdateWord,
}) => {
  return (
    <Card className="border shadow-sm">
      <CardHeader className="py-3 px-4 border-b">
        <div className="flex items-center gap-2">
          <Settings2 className="w-4 h-4 text-primary" />
          <CardTitle className="text-sm font-semibold">
            Pengaturan Konversi
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Output Directory Display */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground">
            Folder Tujuan Simpan
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
              disabled={disabled}
              className="h-8 w-8 shrink-0"
              title="Ganti folder output"
              onClick={onPickOutputDir}
            >
              <FolderOpen className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* 1. Merge PDF Options */}
        {toolId === "merge-pdf" && optionsState.type === "merge-pdf" && (
          <div className="space-y-3 pt-2 border-t">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Nama Berkas Output
              </label>
              <Input
                disabled={disabled}
                value={optionsState.options.outputFileName}
                onChange={(e) => onUpdateMerge({ outputFileName: e.target.value })}
                className="text-xs h-8 font-mono"
                placeholder="merged_document.pdf"
              />
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Berkas-berkas PDF akan digabungkan secara berurutan sesuai daftar di sebelah kiri.
            </p>
          </div>
        )}

        {/* 2. Split PDF Options */}
        {toolId === "split-pdf" && optionsState.type === "split-pdf" && (
          <div className="space-y-3 pt-2 border-t">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Mode Pemotongan
              </label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-muted rounded-lg">
                <Button
                  type="button"
                  variant={optionsState.options.splitMode === "extract_range" ? "default" : "ghost"}
                  size="sm"
                  disabled={disabled}
                  className="h-7 text-xs"
                  onClick={() => onUpdateSplit({ splitMode: "extract_range" })}
                >
                  Pilih Rentang
                </Button>
                <Button
                  type="button"
                  variant={optionsState.options.splitMode === "split_all" ? "default" : "ghost"}
                  size="sm"
                  disabled={disabled}
                  className="h-7 text-xs"
                  onClick={() => onUpdateSplit({ splitMode: "split_all" })}
                >
                  Semua Halaman
                </Button>
              </div>
            </div>

            {optionsState.options.splitMode === "extract_range" && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-foreground">
                    Rentang Halaman
                  </label>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    Contoh: 1-3, 5
                  </span>
                </div>
                <Input
                  disabled={disabled}
                  value={optionsState.options.pageRange}
                  onChange={(e) => onUpdateSplit({ pageRange: e.target.value })}
                  className="text-xs h-8 font-mono"
                  placeholder="1-3, 5"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Awalan Nama Berkas (Prefix)
              </label>
              <Input
                disabled={disabled}
                value={optionsState.options.outputPrefix}
                onChange={(e) => onUpdateSplit({ outputPrefix: e.target.value })}
                className="text-xs h-8 font-mono"
                placeholder="split_document"
              />
            </div>
          </div>
        )}

        {/* 3. Image to PDF Options */}
        {toolId === "image-to-pdf" && optionsState.type === "image-to-pdf" && (
          <div className="space-y-3 pt-2 border-t">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Orientasi Halaman
              </label>
              <div className="grid grid-cols-3 gap-1 p-1 bg-muted rounded-lg">
                {(["auto", "portrait", "landscape"] as const).map((orient) => (
                  <Button
                    key={orient}
                    type="button"
                    variant={optionsState.options.orientation === orient ? "default" : "ghost"}
                    size="sm"
                    disabled={disabled}
                    className="h-7 text-xs capitalize"
                    onClick={() => onUpdateImage({ orientation: orient })}
                  >
                    {orient}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Margin Halaman
              </label>
              <div className="grid grid-cols-3 gap-1 p-1 bg-muted rounded-lg">
                {(["none", "small", "normal"] as const).map((m) => (
                  <Button
                    key={m}
                    type="button"
                    variant={optionsState.options.margin === m ? "default" : "ghost"}
                    size="sm"
                    disabled={disabled}
                    className="h-7 text-xs capitalize"
                    onClick={() => onUpdateImage({ margin: m })}
                  >
                    {m}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Nama Berkas Output
              </label>
              <Input
                disabled={disabled}
                value={optionsState.options.outputFileName}
                onChange={(e) => onUpdateImage({ outputFileName: e.target.value })}
                className="text-xs h-8 font-mono"
                placeholder="converted_images.pdf"
              />
            </div>
          </div>
        )}

        {/* 4. Word to PDF Options */}
        {toolId === "word-to-pdf" && optionsState.type === "word-to-pdf" && (
          <div className="space-y-3 pt-2 border-t">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Nama Berkas Output
              </label>
              <Input
                disabled={disabled}
                value={optionsState.options.outputFileName}
                onChange={(e) => onUpdateWord({ outputFileName: e.target.value })}
                className="text-xs h-8 font-mono"
                placeholder="document.pdf"
              />
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-primary shrink-0" />
              Menjaga format teks, tabel, font, dan margin secara lokal.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

