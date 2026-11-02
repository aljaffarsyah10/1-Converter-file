import { useAppStore } from "@/stores/useAppStore";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { AllToolsPage } from "@/features/tools/AllToolsPage";
import { ToolWorkspacePage } from "@/features/workspace/ToolWorkspacePage";
import { SettingsPage } from "@/features/settings/SettingsPage";
import { Toaster } from "@/components/ui/sonner";

export default function App() {
  const { currentPage } = useAppStore();

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
