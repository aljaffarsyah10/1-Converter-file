export type AppPage = "dashboard" | "all-tools" | "workspace" | "settings";

export type ToolCategory = "PDF Tools" | "Document" | "Image" | "Archive";

export interface ToolItem {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  icon: string;
  priority: "P0" | "P1" | "Future";
  isAvailable: boolean;
  acceptedFormats: string[];
  outputFormat: string;
}

