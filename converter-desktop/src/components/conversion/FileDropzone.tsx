import React, { useEffect, useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StagedFile } from "@/types/conversion";
import { toast } from "sonner";
import {
  getFilesMetadata,
  isTauriEnvironment,
  pickFiles,
} from "@/services/tauriConversionService";
import { getCurrentWebview } from "@tauri-apps/api/webview";

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

  const deliverValidFiles = (files: StagedFile[]) => {
    if (files.length === 0) return;

    if (maxFiles && files.length > maxFiles) {
      toast.warning(`Maksimal ${maxFiles} berkas`, {
        description: `Hanya ${maxFiles} berkas pertama yang akan digunakan.`,
      });
      onFilesAccepted(files.slice(0, maxFiles));
    } else {
      onFilesAccepted(files);
      toast.success(`${files.length} berkas berhasil ditambahkan`);
    }
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
        // In browser fallback, path might be empty, but we fill what's available
        const fileWithPath = file as File & { path?: string };
        validFiles.push({
          id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          path: fileWithPath.path || "",
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

    deliverValidFiles(validFiles);
  };

  const handleSelectFiles = async () => {
    if (disabled) return;

    if (isTauriEnvironment()) {
      try {
        const files = await pickFiles(acceptedFormats, maxFiles !== 1);
        if (files.length > 0) {
          deliverValidFiles(files);
        }
      } catch (err: any) {
        console.error("File dialog error:", err);
        toast.error("Gagal membuka pemilih berkas desktop", {
          description: err?.message || String(err),
        });
      }
    } else {
      fileInputRef.current?.click();
    }
  };

  // Listen to Tauri native window drag-drop events
  useEffect(() => {
    if (!isTauriEnvironment() || disabled) return;

    let unlisten: (() => void) | undefined;

    getCurrentWebview()
      .onDragDropEvent(async (event) => {
        if (event.payload.type === "over" || event.payload.type === "enter") {
          setIsDragOver(true);
        } else if (event.payload.type === "leave") {
          setIsDragOver(false);
        } else if (event.payload.type === "drop") {
          setIsDragOver(false);
          const droppedPaths = event.payload.paths;
          if (droppedPaths && droppedPaths.length > 0) {
            const files = await getFilesMetadata(droppedPaths);
            const validFiles = files.filter((f) => {
              const ext = `.${f.name.split(".").pop()?.toLowerCase() || ""}`;
              return acceptedFormats.some((fmt) => fmt.toLowerCase() === ext);
            });

            if (validFiles.length < files.length) {
              toast.error("Format berkas ditolak", {
                description: `Beberapa berkas yang dijatuhkan bukan format yang didukung (${acceptedFormats.join(", ")}).`,
              });
            }

            deliverValidFiles(validFiles);
          }
        }
      })
      .then((fn) => {
        unlisten = fn;
      })
      .catch((err) => {
        console.warn("Could not register window drag-drop listener:", err);
      });

    return () => {
      if (unlisten) unlisten();
    };
  }, [acceptedFormats, disabled, maxFiles]);

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
      onClick={handleSelectFiles}
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
            {fmt.toUpperCase()}
          </span>
        ))}
      </div>

      <p className="text-xs text-muted-foreground mt-3">
        Pemrosesan 100% lokal di komputer Anda • Berkas asli tetap aman
      </p>

      <Button
        variant="outline"
        size="sm"
        disabled={disabled}
        className="mt-4 text-xs"
        onClick={(e) => {
          e.stopPropagation();
          handleSelectFiles();
        }}
      >
        Pilih Berkas Desktop
      </Button>
    </div>
  );
};
