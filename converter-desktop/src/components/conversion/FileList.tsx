import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StagedFile } from "@/types/conversion";
import { FileText, ArrowUp, ArrowDown, Trash2, Files } from "lucide-react";

interface FileListProps {
  files: StagedFile[];
  canReorder?: boolean;
  disabled?: boolean;
  onRemove: (id: string) => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
  onClearAll: () => void;
}

export const FileList: React.FC<FileListProps> = ({
  files,
  canReorder = false,
  disabled = false,
  onRemove,
  onReorder,
  onClearAll,
}) => {
  if (files.length === 0) return null;

  return (
    <Card className="border shadow-sm">
      <CardHeader className="py-3 px-4 flex flex-row items-center justify-between border-b">
        <div className="flex items-center gap-2">
          <Files className="w-4 h-4 text-primary" />
          <div>
            <CardTitle className="text-sm font-semibold">
              Daftar Berkas Terpilih ({files.length})
            </CardTitle>
            <CardDescription className="text-xs">
              {canReorder
                ? "Gunakan tombol panah untuk mengubah urutan halaman/penggabungan"
                : "Berkas yang siap diproses"}
            </CardDescription>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={onClearAll}
          className="text-xs text-destructive hover:text-destructive h-7"
        >
          Hapus Semua
        </Button>
      </CardHeader>

      <CardContent className="p-2 divide-y divide-border">
        {files.map((file, idx) => (
          <div
            key={file.id}
            className="py-2.5 px-2 flex items-center justify-between gap-3 text-xs hover:bg-muted/40 rounded transition-colors"
          >
            {/* File Info */}
            <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
              <span className="font-mono text-[10px] text-muted-foreground w-5 text-right shrink-0">
                #{idx + 1}
              </span>
              <FileText className="w-4 h-4 text-primary shrink-0" />
              <span className="font-medium truncate text-foreground">
                {file.name}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                {file.format}
              </span>
              <span className="text-[11px] text-muted-foreground shrink-0 font-mono">
                {file.sizeFormatted}
              </span>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1 shrink-0">
              {canReorder && onReorder && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={disabled || idx === 0}
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    title="Pindahkan ke atas"
                    onClick={() => onReorder(idx, idx - 1)}
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={disabled || idx === files.length - 1}
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    title="Pindahkan ke bawah"
                    onClick={() => onReorder(idx, idx + 1)}
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </Button>
                </>
              )}

              <Button
                variant="ghost"
                size="icon"
                disabled={disabled}
                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                title="Hapus dari antrean"
                onClick={() => onRemove(file.id)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
