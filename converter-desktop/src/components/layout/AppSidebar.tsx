import React from "react";
import { useAppStore } from "@/stores/useAppStore";
import { AppPage } from "@/types/navigation";
import {
  LayoutDashboard,
  Grid,
  Settings,
  ShieldCheck,
  FolderSync,
} from "lucide-react";

interface NavItem {
  id: AppPage;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "all-tools", label: "All Tools", icon: Grid },
  { id: "settings", label: "Settings", icon: Settings },
];

export const AppSidebar: React.FC = () => {
  const { currentPage, navigateTo } = useAppStore();

  return (
    <aside className="w-64 border-r bg-card flex flex-col justify-between select-none">
      {/* Brand Header */}
      <div>
        <div className="p-5 border-b flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold shadow">
            <FolderSync className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">File Converter</h1>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
              Offline & Local
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              currentPage === item.id ||
              (item.id === "all-tools" && currentPage === "workspace");

            return (
              <button
                key={item.id}
                onClick={() => navigateTo(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer System Info */}
      <div className="p-4 border-t bg-muted/20">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold text-foreground">100% Private</span>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Files are processed on this device. No uploads to cloud.
        </p>
        <div className="mt-3 text-[10px] text-muted-foreground font-mono">
          v1.1.0 • Expansion
        </div>
      </div>
    </aside>
  );
};

