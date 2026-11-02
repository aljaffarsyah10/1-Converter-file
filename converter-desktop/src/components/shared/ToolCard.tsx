import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ToolItem } from "@/types/navigation";
import { useAppStore } from "@/stores/useAppStore";
import {
  FileText,
  Image as ImageIcon,
  Files,
  Scissors,
  FileImage,
  FileType,
  Sheet,
  Minimize2,
  ArrowRight,
  Lock,
  Presentation,
  Table,
  RotateCw,
  ShieldCheck,
  Unlock,
  Stamp,
  ImageDown,
  ImagePlus,
  Scaling,
  Code,
  FileCode,
} from "lucide-react";

interface ToolCardProps {
  tool: ToolItem;
}

export const ToolCard: React.FC<ToolCardProps> = ({ tool }) => {
  const { openWorkspace } = useAppStore();

  const renderIcon = () => {
    const props = { className: "w-6 h-6 text-primary" };
    switch (tool.icon) {
      case "FileText":
        return <FileText {...props} />;
      case "Image":
        return <ImageIcon {...props} />;
      case "Files":
        return <Files {...props} />;
      case "Scissors":
        return <Scissors {...props} />;
      case "FileImage":
        return <FileImage {...props} />;
      case "FileType":
        return <FileType {...props} />;
      case "Sheet":
        return <Sheet {...props} />;
      case "Minimize2":
        return <Minimize2 {...props} />;
      case "Presentation":
        return <Presentation {...props} />;
      case "Table":
        return <Table {...props} />;
      case "RotateCw":
        return <RotateCw {...props} />;
      case "ShieldCheck":
        return <ShieldCheck {...props} />;
      case "Unlock":
        return <Unlock {...props} />;
      case "Stamp":
        return <Stamp {...props} />;
      case "ImageDown":
        return <ImageDown {...props} />;
      case "ImagePlus":
        return <ImagePlus {...props} />;
      case "Scaling":
        return <Scaling {...props} />;
      case "Code":
        return <Code {...props} />;
      case "FileCode":
        return <FileCode {...props} />;
      default:
        return <FileText {...props} />;
    }
  };

  return (
    <Card
      className={`group relative flex flex-col justify-between transition-all duration-200 border ${
        tool.isAvailable
          ? "hover:border-primary/50 hover:shadow-md cursor-pointer"
          : "opacity-60 bg-muted/30 cursor-not-allowed"
      }`}
      onClick={() => {
        if (tool.isAvailable) {
          openWorkspace(tool.id);
        }
      }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            {renderIcon()}
          </div>
          <span
            className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
              tool.isAvailable
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground flex items-center gap-1"
            }`}
          >
            {!tool.isAvailable && <Lock className="w-3 h-3" />}
            {tool.priority === "P0"
              ? "Ready"
              : tool.priority === "P1"
                ? "Coming Soon"
                : "Planned"}
          </span>
        </div>
        <CardTitle className="text-base font-semibold group-hover:text-primary transition-colors">
          {tool.name}
        </CardTitle>
        <CardDescription className="text-xs line-clamp-2 mt-1">
          {tool.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center justify-between pt-3 border-t text-xs text-muted-foreground">
          <span className="font-mono text-[11px]">
            {tool.acceptedFormats.slice(0, 2).join(", ")} → {tool.outputFormat}
          </span>
          {tool.isAvailable ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs group-hover:translate-x-1 transition-transform"
            >
              Open <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          ) : (
            <span className="text-[11px] text-muted-foreground italic">Coming soon</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

