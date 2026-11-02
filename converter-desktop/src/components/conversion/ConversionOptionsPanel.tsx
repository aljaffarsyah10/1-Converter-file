import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ToolOptionsState } from "@/types/conversion";
import { Settings2, FolderOpen, AlertCircle, Lock, Unlock, Eye, EyeOff, Stamp, ImageDown, RefreshCw, Scaling, Code } from "lucide-react";

interface ConversionOptionsPanelProps {
  toolId: string;
  optionsState: ToolOptionsState;
  defaultOutputPath: string;
  disabled?: boolean;
  onPickOutputDir?: () => void;
  onUpdateMerge: (opts: { outputFileName: string }) => void;
  onUpdateSplit: (opts: {
    splitMode?: "extract_range" | "split_all";
    pageRange?: string;
    outputPrefix?: string;
  }) => void;
  onUpdateImage: (opts: {
    orientation?: "auto" | "portrait" | "landscape";
    pageSize?: "A4" | "FitImage";
    margin?: "none" | "small" | "normal";
    outputFileName?: string;
  }) => void;
  onUpdateWord: (opts: {
    outputFileName?: string;
    openAfterConvert?: boolean;
  }) => void;
  onUpdatePdfToWord?: (opts: {
    outputFileName?: string;
    openAfterConvert?: boolean;
  }) => void;
  onUpdatePdfToImage?: (opts: {
    format?: "png" | "jpg";
    dpi?: 150 | 300;
    pageRange?: string;
    outputPrefix?: string;
  }) => void;
  onUpdateCompress?: (opts: {
    outputFileName?: string;
    level?: "low" | "medium" | "high";
  }) => void;
  onUpdateExcel?: (opts: {
    outputFileName?: string;
    openAfterConvert?: boolean;
  }) => void;
  onUpdatePptx?: (opts: {
    outputFileName?: string;
    openAfterConvert?: boolean;
  }) => void;
  onUpdatePdfToExcel?: (opts: {
    outputFileName?: string;
    openAfterConvert?: boolean;
  }) => void;
  onUpdateRotate?: (opts: {
    outputFileName?: string;
    angle?: 90 | 180 | 270;
    pageRange?: string;
  }) => void;
  onUpdateProtect?: (opts: {
    outputFileName?: string;
    password?: string;
    confirmPassword?: string;
  }) => void;
  onUpdateUnlock?: (opts: {
    outputFileName?: string;
    password?: string;
  }) => void;
  onUpdateWatermark?: (opts: {
    outputFileName?: string;
    text?: string;
    fontSize?: "small" | "medium" | "large";
    opacity?: "10" | "25" | "50";
    position?: "diagonal" | "center";
    color?: string;
  }) => void;
  onUpdateCompressImage?: (opts: {
    outputFileName?: string;
    quality?: number;
    level?: "low" | "medium" | "high";
  }) => void;
  onUpdateConvertImage?: (opts: {
    outputFileName?: string;
    targetFormat?: "png" | "jpg" | "webp" | "bmp";
  }) => void;
  onUpdateResizeImage?: (opts: {
    outputFileName?: string;
    resizeMode?: "dimensions" | "percentage";
    width?: number;
    height?: number;
    scalePercent?: number;
    maintainAspectRatio?: boolean;
  }) => void;
  onUpdateHtmlToPdf?: (opts: {
    outputFileName?: string;
    pageSize?: "A4" | "Letter";
    margin?: "none" | "small" | "normal";
    orientation?: "portrait" | "landscape";
  }) => void;




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
  onUpdatePdfToWord,
  onUpdatePdfToImage,
  onUpdateCompress,
  onUpdateExcel,
  onUpdatePptx,
  onUpdatePdfToExcel,
  onUpdateRotate,
  onUpdateProtect,
  onUpdateUnlock,
  onUpdateWatermark,
  onUpdateCompressImage,
  onUpdateConvertImage,
  onUpdateResizeImage,
  onUpdateHtmlToPdf,
}) => {
  const [showProtectPass, setShowProtectPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [showUnlockPass, setShowUnlockPass] = useState(false);

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
                onChange={(e) =>
                  onUpdateMerge({ outputFileName: e.target.value })
                }
                className="text-xs h-8 font-mono"
                placeholder="merged_document.pdf"
              />
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Berkas-berkas PDF akan digabungkan secara berurutan sesuai daftar
              di sebelah kiri.
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
                  variant={
                    optionsState.options.splitMode === "extract_range"
                      ? "default"
                      : "ghost"
                  }
                  size="sm"
                  disabled={disabled}
                  className="h-7 text-xs"
                  onClick={() => onUpdateSplit({ splitMode: "extract_range" })}
                >
                  Pilih Rentang
                </Button>
                <Button
                  type="button"
                  variant={
                    optionsState.options.splitMode === "split_all"
                      ? "default"
                      : "ghost"
                  }
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
                onChange={(e) =>
                  onUpdateSplit({ outputPrefix: e.target.value })
                }
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
                    variant={
                      optionsState.options.orientation === orient
                        ? "default"
                        : "ghost"
                    }
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
                    variant={
                      optionsState.options.margin === m ? "default" : "ghost"
                    }
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
                onChange={(e) =>
                  onUpdateImage({ outputFileName: e.target.value })
                }
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
                onChange={(e) =>
                  onUpdateWord({ outputFileName: e.target.value })
                }
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

        {/* 5. PDF to Word Options */}
        {toolId === "pdf-to-word" && optionsState.type === "pdf-to-word" && (
          <div className="space-y-3 pt-2 border-t">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Nama Berkas Output (.docx)
              </label>
              <Input
                disabled={disabled}
                value={optionsState.options.outputFileName}
                onChange={(e) =>
                  onUpdatePdfToWord?.({ outputFileName: e.target.value })
                }
                className="text-xs h-8 font-mono"
                placeholder="document.docx"
              />
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-primary shrink-0" />
              Mengekstrak teks & struktur dokumen PDF menjadi berkas DOCX yang
              dapat diedit secara 100% offline.
            </p>
          </div>
        )}
        {/* 6. PDF to Image Options */}
        {toolId === "pdf-to-image" && optionsState.type === "pdf-to-image" && (
          <div className="space-y-3 pt-2 border-t">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Format Gambar
              </label>
              <div className="grid grid-cols-2 gap-1 p-1 bg-muted rounded-lg">
                {(["png", "jpg"] as const).map((fmt) => (
                  <Button
                    key={fmt}
                    type="button"
                    variant={
                      optionsState.options.format === fmt ? "default" : "ghost"
                    }
                    size="sm"
                    disabled={disabled}
                    className="h-7 text-xs uppercase"
                    onClick={() => onUpdatePdfToImage?.({ format: fmt })}
                  >
                    {fmt}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Kualitas Resolusi (DPI)
              </label>
              <div className="grid grid-cols-2 gap-1 p-1 bg-muted rounded-lg">
                {[
                  { label: "150 DPI (Standar)", val: 150 as const },
                  { label: "300 DPI (Tajam)", val: 300 as const },
                ].map((item) => (
                  <Button
                    key={item.val}
                    type="button"
                    variant={
                      optionsState.options.dpi === item.val
                        ? "default"
                        : "ghost"
                    }
                    size="sm"
                    disabled={disabled}
                    className="h-7 text-xs"
                    onClick={() => onUpdatePdfToImage?.({ dpi: item.val })}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Rentang Halaman (Opsional)
              </label>
              <Input
                disabled={disabled}
                value={optionsState.options.pageRange || ""}
                onChange={(e) =>
                  onUpdatePdfToImage?.({ pageRange: e.target.value })
                }
                className="text-xs h-8 font-mono"
                placeholder="Contoh: 1-3, 5 (kosongkan untuk semua)"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Awalan Nama Berkas
              </label>
              <Input
                disabled={disabled}
                value={optionsState.options.outputPrefix}
                onChange={(e) =>
                  onUpdatePdfToImage?.({ outputPrefix: e.target.value })
                }
                className="text-xs h-8 font-mono"
                placeholder="page"
              />
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-primary shrink-0" />
              Setiap halaman PDF akan diekstrak menjadi satu berkas gambar.
            </p>
          </div>
        )}
        {/* Compress PDF Options */}
        {toolId === "compress-pdf" && optionsState.type === "compress-pdf" && (
          <div className="space-y-3 pt-2 border-t">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Tingkat Kompresi
              </label>
              <div className="grid grid-cols-3 gap-1">
                {[
                  {
                    level: "low" as const,
                    label: "Rendah",
                    desc: "Kualitas Tinggi",
                  },
                  {
                    level: "medium" as const,
                    label: "Sedang",
                    desc: "Direkomendasikan",
                  },
                  {
                    level: "high" as const,
                    label: "Tinggi",
                    desc: "Ukuran Minimum",
                  },
                ].map((item) => (
                  <Button
                    key={item.level}
                    type="button"
                    size="sm"
                    variant={
                      optionsState.options.level === item.level
                        ? "default"
                        : "outline"
                    }
                    disabled={disabled}
                    className="h-10 flex flex-col items-center justify-center text-xs p-1"
                    onClick={() => onUpdateCompress?.({ level: item.level })}
                  >
                    <span className="font-semibold">{item.label}</span>
                    <span className="text-[10px] opacity-75 font-normal">
                      {item.desc}
                    </span>
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Nama Berkas Hasil
              </label>
              <Input
                disabled={disabled}
                value={optionsState.options.outputFileName}
                onChange={(e) =>
                  onUpdateCompress?.({ outputFileName: e.target.value })
                }
                className="text-xs h-8 font-mono"
                placeholder="compressed_document.pdf"
              />
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-primary shrink-0" />
              Menghapus objek mubazir dan mengoptimalkan kompresi gambar secara
              lokal.
            </p>
          </div>
        )}
        {/* 8. Excel to PDF Options */}
        {toolId === "excel-to-pdf" && optionsState.type === "excel-to-pdf" && (
          <div className="space-y-3 pt-2 border-t">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Nama Berkas Hasil (.pdf)
              </label>
              <Input
                disabled={disabled}
                value={optionsState.options.outputFileName}
                onChange={(e) =>
                  onUpdateExcel?.({ outputFileName: e.target.value })
                }
                className="text-xs h-8 font-mono"
                placeholder="converted_spreadsheet.pdf"
              />
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-primary shrink-0" />
              Mengonversi spreadsheet XLSX, XLS, atau CSV menjadi halaman PDF
              secara rapi dan offline.
            </p>
          </div>
        )}
        {/* 9. PowerPoint to PDF Options */}
        {toolId === "pptx-to-pdf" && optionsState.type === "pptx-to-pdf" && (
          <div className="space-y-3 pt-2 border-t">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Nama Berkas Hasil (.pdf)
              </label>
              <Input
                disabled={disabled}
                value={optionsState.options.outputFileName}
                onChange={(e) =>
                  onUpdatePptx?.({ outputFileName: e.target.value })
                }
                className="text-xs h-8 font-mono"
                placeholder="converted_presentation.pdf"
              />
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-primary shrink-0" />
              Mengonversi slide presentasi PPTX atau PPT menjadi halaman PDF
              berkualitas tinggi secara offline.
            </p>
          </div>
        )}
        {/* 10. PDF to Excel Options */}
        {toolId === "pdf-to-excel" && optionsState.type === "pdf-to-excel" && (
          <div className="space-y-3 pt-2 border-t">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Nama Berkas Output (.xlsx)
              </label>
              <Input
                disabled={disabled}
                value={optionsState.options.outputFileName}
                onChange={(e) =>
                  onUpdatePdfToExcel?.({ outputFileName: e.target.value })
                }
                className="text-xs h-8 font-mono"
                placeholder="extracted_tables.xlsx"
              />
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-primary shrink-0" />
              Mengekstrak baris & tabel data dari dokumen PDF ke dalam
              spreadsheet Excel secara 100% offline.
            </p>
          </div>
        )}

        {/* 12. Protect PDF Options */}
        {toolId === "protect-pdf" && optionsState.type === "protect-pdf" && (
          <div className="space-y-3 pt-2 border-t">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-primary" />
                Kata Sandi Baru (Password)
              </label>
              <div className="relative">
                <Input
                  disabled={disabled}
                  type={showProtectPass ? "text" : "password"}
                  value={optionsState.options.password}
                  onChange={(e) => onUpdateProtect?.({ password: e.target.value })}
                  className="text-xs h-8 pr-8"
                  placeholder="Masukkan kata sandi perlindungan"
                />
                <button
                  type="button"
                  onClick={() => setShowProtectPass(!showProtectPass)}
                  className="absolute right-2 top-2 text-muted-foreground hover:text-foreground cursor-pointer"
                  tabIndex={-1}
                >
                  {showProtectPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Konfirmasi Kata Sandi
              </label>
              <div className="relative">
                <Input
                  disabled={disabled}
                  type={showConfirmPass ? "text" : "password"}
                  value={optionsState.options.confirmPassword || ""}
                  onChange={(e) => onUpdateProtect?.({ confirmPassword: e.target.value })}
                  className="text-xs h-8 pr-8"
                  placeholder="Ulangi kata sandi di atas"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  className="absolute right-2 top-2 text-muted-foreground hover:text-foreground cursor-pointer"
                  tabIndex={-1}
                >
                  {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {optionsState.options.confirmPassword && (
                <div className="text-[11px] font-medium">
                  {optionsState.options.password === optionsState.options.confirmPassword ? (
                    <span className="text-green-600 dark:text-green-400">✓ Kata sandi cocok</span>
                  ) : (
                    <span className="text-destructive">✗ Kata sandi tidak cocok</span>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Nama Berkas Hasil (.pdf)
              </label>
              <Input
                disabled={disabled}
                value={optionsState.options.outputFileName}
                onChange={(e) => onUpdateProtect?.({ outputFileName: e.target.value })}
                className="text-xs h-8 font-mono"
                placeholder="protected_document.pdf"
              />
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-primary shrink-0" />
              Mengenkripsi berkas dengan standar keamanan 128-bit. Diperlukan kata sandi setiap kali berkas dibuka.
            </p>
          </div>
        )}



        {/* 15. Compress Image Options */}
        {toolId === "image-compress" && optionsState.type === "image-compress" && (
          <div className="space-y-3 pt-2 border-t">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <ImageDown className="w-3.5 h-3.5 text-primary" />
                Tingkat Kompresi
              </label>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { level: "low" as const, label: "Tinggi", desc: "Ukuran Terkecil (40%)" },
                  { level: "medium" as const, label: "Sedang", desc: "Seimbang (70%)" },
                  { level: "high" as const, label: "Kualitas", desc: "Visual Tajam (85%)" },
                ].map((item) => (
                  <Button
                    key={item.level}
                    type="button"
                    size="sm"
                    variant={optionsState.options.level === item.level ? "default" : "outline"}
                    disabled={disabled}
                    className="h-10 flex flex-col items-center justify-center text-xs p-1"
                    onClick={() => onUpdateCompressImage?.({ level: item.level })}
                  >
                    <span className="font-semibold">{item.label}</span>
                    <span className="text-[10px] opacity-75 font-normal">{item.desc}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Nama Berkas Hasil
              </label>
              <Input
                disabled={disabled}
                value={optionsState.options.outputFileName}
                onChange={(e) => onUpdateCompressImage?.({ outputFileName: e.target.value })}
                className="text-xs h-8 font-mono"
                placeholder="compressed_image"
              />
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-primary shrink-0" />
              Mengoptimalkan ukuran berkas gambar tanpa mengurangi kejelasan visual secara signifikan.
            </p>
          </div>
        )}

        {/* 16. Convert Image Options */}
        {toolId === "image-convert" && optionsState.type === "image-convert" && (
          <div className="space-y-3 pt-2 border-t">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 text-primary" />
                Format Target
              </label>
              <div className="grid grid-cols-4 gap-1">
                {(["png", "jpg", "webp", "bmp"] as const).map((fmt) => (
                  <Button
                    key={fmt}
                    type="button"
                    size="sm"
                    variant={optionsState.options.targetFormat === fmt ? "default" : "outline"}
                    disabled={disabled}
                    className="h-9 uppercase font-bold text-xs"
                    onClick={() => onUpdateConvertImage?.({ targetFormat: fmt })}
                  >
                    {fmt}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Nama Berkas Hasil
              </label>
              <Input
                disabled={disabled}
                value={optionsState.options.outputFileName}
                onChange={(e) => onUpdateConvertImage?.({ outputFileName: e.target.value })}
                className="text-xs h-8 font-mono"
                placeholder="converted_image"
              />
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-primary shrink-0" />
              Mengonversi berkas gambar antar format modern (PNG, JPG, WebP, BMP) secara langsung.
            </p>
          </div>
        )}


        {/* 18. HTML to PDF Options */}
        {toolId === "html-to-pdf" && optionsState.type === "html-to-pdf" && (
          <div className="space-y-3 pt-2 border-t">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-primary" />
                Ukuran Kertas
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { size: "A4" as const, label: "A4", desc: "210 × 297 mm" },
                  { size: "Letter" as const, label: "US Letter", desc: "8.5 × 11 in" },
                ].map((item) => (
                  <Button
                    key={item.size}
                    type="button"
                    size="sm"
                    variant={optionsState.options.pageSize === item.size ? "default" : "outline"}
                    disabled={disabled}
                    className="h-10 flex flex-col items-center justify-center text-xs p-1"
                    onClick={() => onUpdateHtmlToPdf?.({ pageSize: item.size })}
                  >
                    <span className="font-semibold">{item.label}</span>
                    <span className="text-[10px] opacity-75 font-normal">{item.desc}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Orientasi Halaman
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { ori: "portrait" as const, label: "Tegak (Portrait)" },
                  { ori: "landscape" as const, label: "Mendatar (Landscape)" },
                ].map((item) => (
                  <Button
                    key={item.ori}
                    type="button"
                    size="sm"
                    variant={optionsState.options.orientation === item.ori ? "default" : "outline"}
                    disabled={disabled}
                    className="h-8 text-xs font-semibold"
                    onClick={() => onUpdateHtmlToPdf?.({ orientation: item.ori })}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Batas Tepi (Margin)
              </label>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { m: "normal" as const, label: "Standar", desc: "15 mm" },
                  { m: "small" as const, label: "Sempit", desc: "8 mm" },
                  { m: "none" as const, label: "Tanpa Margin", desc: "0 mm" },
                ].map((item) => (
                  <Button
                    key={item.m}
                    type="button"
                    size="sm"
                    variant={optionsState.options.margin === item.m ? "default" : "outline"}
                    disabled={disabled}
                    className="h-10 flex flex-col items-center justify-center text-xs p-1"
                    onClick={() => onUpdateHtmlToPdf?.({ margin: item.m })}
                  >
                    <span className="font-semibold">{item.label}</span>
                    <span className="text-[10px] opacity-75 font-normal">{item.desc}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Nama Berkas Hasil (.pdf)
              </label>
              <Input
                disabled={disabled}
                value={optionsState.options.outputFileName}
                onChange={(e) => onUpdateHtmlToPdf?.({ outputFileName: e.target.value })}
                className="text-xs h-8 font-mono"
                placeholder="rendered_document.pdf"
              />
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-primary shrink-0" />
              Merender halaman HTML dan styling CSS secara offline dengan engine browser bawaan Windows.
            </p>
          </div>
        )}

        {/* 17. Resize Image Options */}
        {toolId === "image-resize" && optionsState.type === "image-resize" && (
          <div className="space-y-3 pt-2 border-t">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Scaling className="w-3.5 h-3.5 text-primary" />
                Mode Pengubahan Ukuran
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { mode: "percentage" as const, label: "Persentase (%)" },
                  { mode: "dimensions" as const, label: "Dimensi Piksel (px)" },
                ].map((item) => (
                  <Button
                    key={item.mode}
                    type="button"
                    size="sm"
                    variant={optionsState.options.resizeMode === item.mode ? "default" : "outline"}
                    disabled={disabled}
                    className="h-8 text-xs font-semibold"
                    onClick={() => onUpdateResizeImage?.({ resizeMode: item.mode })}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
            </div>

            {optionsState.options.resizeMode === "percentage" ? (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Skala Ukuran ({optionsState.options.scalePercent || 50}%)
                </label>
                <div className="grid grid-cols-4 gap-1">
                  {[25, 50, 75, 150].map((pct) => (
                    <Button
                      key={pct}
                      type="button"
                      size="sm"
                      variant={optionsState.options.scalePercent === pct ? "default" : "outline"}
                      disabled={disabled}
                      className="h-8 text-xs font-semibold"
                      onClick={() => onUpdateResizeImage?.({ scalePercent: pct })}
                    >
                      {pct}%
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">
                      Lebar (px)
                    </label>
                    <Input
                      disabled={disabled}
                      type="number"
                      value={optionsState.options.width || ""}
                      onChange={(e) => onUpdateResizeImage?.({ width: e.target.value ? parseInt(e.target.value) : undefined })}
                      className="text-xs h-8 font-mono"
                      placeholder="Contoh: 800"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-muted-foreground">
                      Tinggi (px)
                    </label>
                    <Input
                      disabled={disabled}
                      type="number"
                      value={optionsState.options.height || ""}
                      onChange={(e) => onUpdateResizeImage?.({ height: e.target.value ? parseInt(e.target.value) : undefined })}
                      className="text-xs h-8 font-mono"
                      placeholder="Contoh: 600"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={optionsState.options.maintainAspectRatio}
                    disabled={disabled}
                    onChange={(e) => onUpdateResizeImage?.({ maintainAspectRatio: e.target.checked })}
                    className="rounded border-gray-300 text-primary focus:ring-primary h-3.5 w-3.5"
                  />
                  <span className="text-xs font-medium text-foreground select-none">
                    Pertahankan Rasio Aspek (Aspect Ratio)
                  </span>
                </label>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Nama Berkas Hasil
              </label>
              <Input
                disabled={disabled}
                value={optionsState.options.outputFileName}
                onChange={(e) => onUpdateResizeImage?.({ outputFileName: e.target.value })}
                className="text-xs h-8 font-mono"
                placeholder="resized_image"
              />
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-primary shrink-0" />
              Mengubah dimensi lebar dan tinggi gambar dengan filter interpolasi Lanczos3 berkualitas tinggi.
            </p>
          </div>
        )}

        {/* 14. Watermark PDF Options */}
        {toolId === "watermark-pdf" && optionsState.type === "watermark-pdf" && (
          <div className="space-y-3 pt-2 border-t">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Stamp className="w-3.5 h-3.5 text-primary" />
                Teks Watermark
              </label>
              <Input
                disabled={disabled}
                value={optionsState.options.text}
                onChange={(e) => onUpdateWatermark?.({ text: e.target.value })}
                className="text-xs h-8 font-semibold"
                placeholder="Contoh: CONFIDENTIAL, DRAFT, SALINAN"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Posisi Tampilan
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { pos: "diagonal" as const, label: "Diagonal (45°)", desc: "Melintang Tengah" },
                  { pos: "center" as const, label: "Horizontal", desc: "Tengah Mendatar" },
                ].map((item) => (
                  <Button
                    key={item.pos}
                    type="button"
                    size="sm"
                    variant={optionsState.options.position === item.pos ? "default" : "outline"}
                    disabled={disabled}
                    className="h-10 flex flex-col items-center justify-center text-xs p-1"
                    onClick={() => onUpdateWatermark?.({ position: item.pos })}
                  >
                    <span className="font-semibold">{item.label}</span>
                    <span className="text-[10px] opacity-75 font-normal">{item.desc}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Ukuran Font
              </label>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { size: "small" as const, label: "Kecil", desc: "36 pt" },
                  { size: "medium" as const, label: "Sedang", desc: "54 pt" },
                  { size: "large" as const, label: "Besar", desc: "72 pt" },
                ].map((item) => (
                  <Button
                    key={item.size}
                    type="button"
                    size="sm"
                    variant={optionsState.options.fontSize === item.size ? "default" : "outline"}
                    disabled={disabled}
                    className="h-10 flex flex-col items-center justify-center text-xs p-1"
                    onClick={() => onUpdateWatermark?.({ fontSize: item.size })}
                  >
                    <span className="font-semibold">{item.label}</span>
                    <span className="text-[10px] opacity-75 font-normal">{item.desc}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Transparansi / Opasitas
              </label>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { op: "10" as const, label: "Tipis", desc: "10%" },
                  { op: "25" as const, label: "Standar", desc: "25%" },
                  { op: "50" as const, label: "Tegas", desc: "50%" },
                ].map((item) => (
                  <Button
                    key={item.op}
                    type="button"
                    size="sm"
                    variant={optionsState.options.opacity === item.op ? "default" : "outline"}
                    disabled={disabled}
                    className="h-10 flex flex-col items-center justify-center text-xs p-1"
                    onClick={() => onUpdateWatermark?.({ opacity: item.op })}
                  >
                    <span className="font-semibold">{item.label}</span>
                    <span className="text-[10px] opacity-75 font-normal">{item.desc}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Nama Berkas Hasil (.pdf)
              </label>
              <Input
                disabled={disabled}
                value={optionsState.options.outputFileName}
                onChange={(e) => onUpdateWatermark?.({ outputFileName: e.target.value })}
                className="text-xs h-8 font-mono"
                placeholder="watermarked_document.pdf"
              />
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-primary shrink-0" />
              Menambahkan tanda air semi-transparan pada setiap halaman PDF tanpa merusak isi dokumen.
            </p>
          </div>
        )}

        {/* 13. Unlock PDF Options */}
        {toolId === "unlock-pdf" && optionsState.type === "unlock-pdf" && (
          <div className="space-y-3 pt-2 border-t">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Unlock className="w-3.5 h-3.5 text-primary" />
                Kata Sandi Pembuka
              </label>
              <div className="relative">
                <Input
                  disabled={disabled}
                  type={showUnlockPass ? "text" : "password"}
                  value={optionsState.options.password}
                  onChange={(e) => onUpdateUnlock?.({ password: e.target.value })}
                  className="text-xs h-8 pr-8"
                  placeholder="Masukkan kata sandi dokumen PDF"
                />
                <button
                  type="button"
                  onClick={() => setShowUnlockPass(!showUnlockPass)}
                  className="absolute right-2 top-2 text-muted-foreground hover:text-foreground cursor-pointer"
                  tabIndex={-1}
                >
                  {showUnlockPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Nama Berkas Hasil (.pdf)
              </label>
              <Input
                disabled={disabled}
                value={optionsState.options.outputFileName}
                onChange={(e) => onUpdateUnlock?.({ outputFileName: e.target.value })}
                className="text-xs h-8 font-mono"
                placeholder="unlocked_document.pdf"
              />
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-primary shrink-0" />
              Menghapus proteksi password secara permanen pada salinan PDF baru sehingga dapat dibuka bebas tanpa password.
            </p>
          </div>
        )}

        {/* 11. Rotate PDF Options */}
        {toolId === "rotate-pdf" && optionsState.type === "rotate-pdf" && (
          <div className="space-y-3 pt-2 border-t">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Sudut Rotasi
              </label>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { angle: 90 as const, label: "90° Kanan", desc: "Searah Jarum Jam" },
                  { angle: 180 as const, label: "180° Balik", desc: "Terbalik" },
                  { angle: 270 as const, label: "90° Kiri", desc: "Berlawanan" },
                ].map((item) => (
                  <Button
                    key={item.angle}
                    type="button"
                    size="sm"
                    variant={optionsState.options.angle === item.angle ? "default" : "outline"}
                    disabled={disabled}
                    className="h-10 flex flex-col items-center justify-center text-xs p-1"
                    onClick={() => onUpdateRotate?.({ angle: item.angle })}
                  >
                    <span className="font-semibold">{item.label}</span>
                    <span className="text-[10px] opacity-75 font-normal">{item.desc}</span>
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Halaman yang Diputar (Opsional)
              </label>
              <Input
                disabled={disabled}
                value={optionsState.options.pageRange || ""}
                onChange={(e) => onUpdateRotate?.({ pageRange: e.target.value })}
                className="text-xs h-8 font-mono"
                placeholder="Contoh: 1, 3-5 (kosongkan untuk semua halaman)"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                Nama Berkas Hasil (.pdf)
              </label>
              <Input
                disabled={disabled}
                value={optionsState.options.outputFileName}
                onChange={(e) => onUpdateRotate?.({ outputFileName: e.target.value })}
                className="text-xs h-8 font-mono"
                placeholder="rotated_document.pdf"
              />
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-primary shrink-0" />
              Memutar orientasi tampilan halaman PDF tanpa menurunkan kualitas berkas asli.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
