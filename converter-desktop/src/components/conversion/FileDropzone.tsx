import React, { useRef, useState } from "react";
import { UploadCloud, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StagedFile } from "@/types/conversion";
import { toast } from "sonner";

interface FileDropzoneProps {
  acceptedFormats: string[];
  maxFiles?: number;
  onFilesAccepted: (files: StagedFile[]) => void;
  disabled?: boolean;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  acceptedFormats,
  maxFiles,
  onFilesAccepted,
  disabled = false,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const processFileList = (fileList: FileList | File[]) => {
    const rawFiles = Array.from(fileList);
    const validFiles: StagedFile[] = [];
    const rejectedNames: string[] = [];

    rawFiles.forEach((file) => {
      const extension = `.${file.name.split(".").pop()?.toLowerCase() || ""}`;
      const isAccepted = acceptedFormats.some(
        (fmt) => fmt.toLowerCase() === extension
      );

      if (isAccepted) {
        validFiles.push({
          id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          size: file.size,
          sizeFormatted: formatFileSize(file.size),
          format: extension.replace(".", "").toUpperCase(),
          lastModified: file.lastModified,
        });
      } else {
        rejectedNames.push(file.name);
      }
    });

    if (rejectedNames.length > 0) {
      toast.error("Format berkas ditolak", {
        description: `Berkas berikut tidak didukung: ${rejectedNames.slice(0, 2).join(", ")}. Hanya mendukung ${acceptedFormats.join(", ")}`,
      });
    }

    if (validFiles.length > 0) {
      if (maxFiles && validFiles.length > maxFiles) {
        toast.warning(`Maksimal ${maxFiles} berkas`, {
          description: `Hanya ${maxFiles} berkas pertama yang akan digunakan.`,
        });
        onFilesAccepted(validFiles.slice(0, maxFiles));
      } else {
        onFilesAccepted(validFiles);
        toast.success(`${validFiles.length} berkas berhasil ditambahkan`);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFileList(e.dataTransfer.files);
    }
  };

  const handleManualSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFileList(e.target.files);
    }
    // Reset input value so re-selecting same file works
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all ${
        isDragOver
          ? "border-primary bg-primary/5 scale-[0.99]"
          : "border-border bg-card hover:border-primary/40 hover:bg-muted/10"
      } ${disabled ? "opacity-50 pointer-events-none" : "cursor-pointer"}`}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple={maxFiles !== 1}
        accept={acceptedFormats.join(",")}
        onChange={handleManualSelect}
        className="hidden"
      />

      <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
        <UploadCloud className="w-6 h-6" />
      </div>

      <h3 className="text-sm font-semibold tracking-tight text-foreground">
        Tarik & Lepas berkas ke area ini, atau klik untuk memilih
      </h3>

      <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2 max-w-md">
        <span className="text-xs text-muted-foreground mr-1">Mendukung format:</span>
        {acceptedFormats.map((fmt) => (
          <span
            key={fmt}
            className="text-[11px] font-mono px-2 py-0.5 rounded bg-secondary text-secondary-foreground"
          >
            {fmt}
          </span>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          type="button"
          className="text-xs"
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
        >
          Pilih Berkas
        </Button>

        {/* Demo Button to add synthetic valid file for testing */}
        <Button
          variant="ghost"
          size="sm"
          type="button"
          className="text-xs text-muted-foreground"
          onClick={(e) => {
            e.stopPropagation();
            const format = acceptedFormats[0];
            const sample: StagedFile = {
              id: `sample-${Date.now()}`,
              name: `contoh_dokumen_${Date.now().toString().slice(-4)}${format}`,
              size: 1024 * 750, // 750 KB
              sizeFormatted: "750 KB",
              format: format.replace(".", "").toUpperCase(),
              lastModified: Date.now(),
            };
            onFilesAccepted([sample]);
            toast.info("Sampel berkas simulasi ditambahkan");
          }}
        >
          + Tambah Sampel Uji
        </Button>
      </div>

      <p className="text-[11px] text-muted-foreground mt-3 flex items-center gap-1">
        <AlertCircle className="w-3.5 h-3.5 text-muted-foreground" />
        Pemrosesan 100% lokal di perangkat Anda. Berkas asli tidak diubah.
      </p>
    </div>
  );
};

