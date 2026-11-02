import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Loader2, XCircle } from "lucide-react";

interface ProgressDisplayProps {
  progress: number;
  stage: string;
  onCancel: () => void;
}

export const ProgressDisplay: React.FC<ProgressDisplayProps> = ({
  progress,
  stage,
  onCancel,
}) => {
  return (
    <Card className="border shadow-md bg-card/90 backdrop-blur-sm animate-in fade-in duration-200">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
            <span className="text-xs font-semibold text-foreground">
              Memproses Konversi...
            </span>
          </div>
          <span className="font-mono text-xs font-bold text-primary">
            {progress}%
          </span>
        </div>

        <Progress value={progress} className="h-2 w-full transition-all" />

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
          <span className="truncate max-w-[280px] italic">{stage}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="h-7 text-xs text-destructive hover:text-destructive gap-1 px-2"
          >
            <XCircle className="w-3.5 h-3.5" /> Batal
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

