import { useEffect } from "react";
import { useAppStore } from "@/stores/useAppStore";
import { useConversionStore } from "@/stores/useConversionStore";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { AllToolsPage } from "@/features/tools/AllToolsPage";
import { ToolWorkspacePage } from "@/features/workspace/ToolWorkspacePage";
import { SettingsPage } from "@/features/settings/SettingsPage";
import { Toaster } from "@/components/ui/sonner";
import { getDefaultOutputDir } from "@/services/tauriConversionService";

export default function App() {
  const { currentPage, theme, setDefaultOutputPath } = useAppStore();
  const { setOutputDir } = useConversionStore();

  // Initialize theme on launch
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (theme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      const isSystemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.toggle("dark", isSystemDark);
    }
  }, [theme]);

  // Initialize default output folder from backend on launch
  useEffect(() => {
    getDefaultOutputDir().then((dir) => {
      if (dir) {
        setDefaultOutputPath(dir);
        setOutputDir(dir);
      }
    });
  }, [setDefaultOutputPath, setOutputDir]);

  const renderCurrentPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <DashboardPage />;
      case "all-tools":
        return <AllToolsPage />;
      case "workspace":
        return <ToolWorkspacePage />;
      case "settings":
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground font-sans">
      {/* Desktop Navigation Sidebar */}
      <AppSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AppHeader />
        {renderCurrentPage()}
      </div>

      {/* Global Notifications */}
      <Toaster position="bottom-right" />
    </div>
  );
}
