import React from "react";
import { useAppStore } from "@/stores/useAppStore";
import { Button } from "@/components/ui/button";
import { TOOLS_CATALOG } from "@/data/tools";
import { ArrowLeft, Moon, Sun, Monitor, Bell } from "lucide-react";
import { toast } from "sonner";

export const AppHeader: React.FC = () => {
  const { currentPage, selectedToolId, navigateTo, theme, setTheme } =
    useAppStore();

  const currentTool = TOOLS_CATALOG.find((t) => t.id === selectedToolId);

  const getPageTitle = () => {
    switch (currentPage) {
      case "dashboard":
        return "Dashboard";
      case "all-tools":
        return "All Conversion Tools";
      case "workspace":
        return currentTool ? currentTool.name : "Tool Workspace";
      case "settings":
        return "Settings & Preferences";
      default:
        return "File Converter";
    }
  };

  const cycleTheme = () => {
    const nextTheme =
      theme === "system" ? "light" : theme === "light" ? "dark" : "system";
    setTheme(nextTheme);

    // Apply dark class to document root
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (nextTheme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.toggle("dark", systemDark);
    }

    toast(`Theme changed to ${nextTheme}`);
  };

  return (
    <header className="h-16 border-b bg-card px-6 flex items-center justify-between select-none">
      <div className="flex items-center gap-3">
        {currentPage === "workspace" && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateTo("dashboard")}
            className="h-8 gap-1 text-xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </Button>
        )}
        <div>
          <h2 className="text-base font-semibold tracking-tight leading-none">
            {getPageTitle()}
          </h2>
          <p className="text-[11px] text-muted-foreground mt-1">
            {currentPage === "dashboard" && "Quick access to your core document utilities"}
            {currentPage === "all-tools" && "Browse all supported offline format converters"}
            {currentPage === "workspace" && (currentTool?.description || "Configure and execute conversion")}
            {currentPage === "settings" && "Configure app defaults and appearance"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={() =>
            toast.info("Offline-First Ready", {
              description: "All core tools process files locally on your machine.",
            })
          }
          title="Notifications & Status"
        >
          <Bell className="w-4 h-4" />
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={cycleTheme}
          className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground capitalize"
          title="Toggle Theme (Light / Dark / System)"
        >
          {theme === "light" && <Sun className="w-3.5 h-3.5 text-amber-500" />}
          {theme === "dark" && <Moon className="w-3.5 h-3.5 text-blue-400" />}
          {theme === "system" && <Monitor className="w-3.5 h-3.5 text-slate-500" />}
          <span>{theme}</span>
        </Button>
      </div>
    </header>
  );
};
