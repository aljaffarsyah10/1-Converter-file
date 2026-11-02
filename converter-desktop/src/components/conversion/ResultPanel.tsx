import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConversionResult, ConversionError } from "@/types/conversion";
import {
  CheckCircle2,
  AlertTriangle,
  FolderOpen,
  FileCheck,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import {
  openResultFile,
  revealResultFile,
} from "@/services/tauriConversionService";

interface ResultPanelProps {
  result: ConversionResult | null;
  error: ConversionError | null;
  onReset: () => void;
}

export const ResultPanel: React.FC<ResultPanelProps> = ({
  result,
  error,
  onReset,
}) => {
  if (!result && !error) return null;

  if (error) {
    return (
      <Card className="border-destructive/40 bg-destructive/5 shadow-md animate-in fade-in duration-200">
        <CardHeader className="py-4 px-5 border-b border-destructive/20 flex flex-row items-center gap-2.5">
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
          <div>
            <CardTitle className="text-sm font-semibold text-destructive">
              Konversi Gagal
            </CardTitle>
            <p className="text-[11px] text-destructive/80 font-mono mt-0.5">
              Kode Kesalahan: {error.code}
            </p>
          </div>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          <p className="text-xs text-foreground leading-relaxed font-medium">
            {error.message}
          </p>

          {error.actionableHint && (
            <div className="p-3 bg-card border rounded-lg text-xs text-muted-foreground leading-relaxed">
              💡 <strong>Saran:</strong> {error.actionableHint}
            </div>
          )}

          <Button
            onClick={onReset}
            variant="outline"
            size="sm"
            className="w-full text-xs gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Atur Ulang & Coba Lagi
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (result) {
    const handleOpenFile = async () => {
      try {
        await openResultFile(result.outputPath);
      } catch (err: any) {
        toast.error("Gagal membuka berkas", {
          description: err?.message || String(err),
        });
      }
    };

    const handleRevealFolder = async () => {
      try {
        await revealResultFile(result.outputPath);
      } catch (err: any) {
        toast.error("Gagal membuka folder tujuan", {
          description: err?.message || String(err),
        });
      }
    };

    return (
      <Card className="border-emerald-500/40 bg-emerald-500/5 shadow-md animate-in fade-in duration-200">
        <CardHeader className="py-4 px-5 border-b border-emerald-500/20 flex flex-row items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div>
            <CardTitle className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
              Konversi Berhasil
            </CardTitle>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Selesai dalam {result.durationMs} ms pada {result.createdAt}
            </p>
          </div>
        </CardHeader>

        <CardContent className="p-5 space-y-4">
          <div className="p-3.5 bg-card border rounded-lg space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Berkas Hasil:</span>
              <span className="font-semibold font-mono text-foreground flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                {result.outputFileName}
              </span>
            </div>

            <div className="flex items-center justify-between border-t pt-2">
              <span className="text-muted-foreground">Ukuran:</span>
              <span className="font-mono text-foreground">
                {result.outputSizeFormatted}
              </span>
            </div>

            {result.reductionPercent !== undefined && (
              <div className="flex items-center justify-between border-t pt-2">
                <span className="text-muted-foreground">Efisiensi Ukuran:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {result.reductionPercent > 0
                    ? `Berkurang ${result.reductionPercent.toFixed(1)}%`
                    : "Sudah teroptimasi secara optimal"}
                </span>
              </div>
            )}

            {result.totalPages !== undefined && (
              <div className="flex items-center justify-between border-t pt-2">
                <span className="text-muted-foreground">Total Halaman:</span>
                <span className="font-mono text-foreground">
                  {result.totalPages} Halaman
                </span>
              </div>
            )}

            <div className="flex items-center justify-between border-t pt-2">
              <span className="text-muted-foreground">Lokasi:</span>
              <span
                className="font-mono text-[11px] text-muted-foreground truncate max-w-[200px]"
                title={result.outputPath}
              >
                {result.outputPath}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1.5"
              onClick={handleOpenFile}
            >
              <ExternalLink className="w-3.5 h-3.5" /> Buka Berkas
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1.5"
              onClick={handleRevealFolder}
            >
              <FolderOpen className="w-3.5 h-3.5" /> Buka di Folder
            </Button>
          </div>

          <Button
            onClick={onReset}
            size="sm"
            className="w-full text-xs gap-1.5 shadow"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Konversi Berkas Lain
          </Button>
        </CardContent>
      </Card>
    );
  }

  return null;
};
