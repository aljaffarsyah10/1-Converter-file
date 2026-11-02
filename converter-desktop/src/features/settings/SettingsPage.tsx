import React from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { useAppStore } from "@/stores/useAppStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Moon, Sun, Monitor, HardDrive, Info } from "lucide-react";
import { toast } from "sonner";

export const SettingsPage: React.FC = () => {
  const { theme, setTheme, defaultOutputPath, setDefaultOutputPath } = useAppStore();

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else if (newTheme === "light") {
      document.documentElement.classList.remove("dark");
    } else {
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.toggle("dark", systemDark);
    }
    toast.success(`Theme updated to ${newTheme}`);
  };

  return (
    <PageContainer>
      <div className="max-w-3xl space-y-6">
        {/* Appearance Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Appearance</CardTitle>
            <CardDescription className="text-xs">
              Customize the desktop application visual theme
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium">Color Theme</p>
                <p className="text-[11px] text-muted-foreground">
                  Select Light, Dark, or follow your Windows system theme
                </p>
              </div>
              <div className="flex gap-1.5 p-1 bg-muted rounded-lg border">
                <Button
                  variant={theme === "light" ? "default" : "ghost"}
                  size="sm"
                  className="h-7 px-2.5 text-xs gap-1.5"
                  onClick={() => handleThemeChange("light")}
                >
                  <Sun className="w-3.5 h-3.5" /> Light
                </Button>
                <Button
                  variant={theme === "dark" ? "default" : "ghost"}
                  size="sm"
                  className="h-7 px-2.5 text-xs gap-1.5"
                  onClick={() => handleThemeChange("dark")}
                >
                  <Moon className="w-3.5 h-3.5" /> Dark
                </Button>
                <Button
                  variant={theme === "system" ? "default" : "ghost"}
                  size="sm"
                  className="h-7 px-2.5 text-xs gap-1.5"
                  onClick={() => handleThemeChange("system")}
                >
                  <Monitor className="w-3.5 h-3.5" /> System
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* File & Storage Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">File & Storage</CardTitle>
            <CardDescription className="text-xs">
              Configure default save locations for converted documents
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Default Output Folder</label>
              <div className="flex gap-2">
                <Input
                  value={defaultOutputPath}
                  onChange={(e) => setDefaultOutputPath(e.target.value)}
                  className="text-xs h-8 font-mono"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs shrink-0"
                  onClick={() => toast.info("Native folder dialog integrated in Phase 8")}
                >
                  <HardDrive className="w-3.5 h-3.5 mr-1" /> Browse
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Output files are saved to this folder unless specified otherwise per job.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Architecture Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <CardTitle className="text-base font-semibold">Privacy & Security</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Local processing guarantees
            </CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-2">
            <p>
              • <strong>Zero Cloud Uploads:</strong> All document and image operations
              run entirely through local CPU/RAM on this machine.
            </p>
            <p>
              • <strong>No Telemetry:</strong> No tracking, analytics, or behavioral
              data is collected or transmitted.
            </p>
            <p>
              • <strong>Non-Destructive:</strong> Original input documents are opened
              exclusively in read-only mode and are never overwritten or deleted.
            </p>
          </CardContent>
        </Card>

        {/* About & Version Info */}
        <Card className="bg-muted/30">
          <CardHeader className="py-3 px-4">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-muted-foreground" />
              <CardTitle className="text-xs font-medium">About File Converter Desktop</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-4 py-2 text-[11px] text-muted-foreground space-y-1 font-mono">
            <div>Version: 0.1.0-mvp (Tauri 2 + React + Rust)</div>
            <div>Platform: Windows 10/11 64-bit</div>
            <div>Architecture: Offline-First Desktop</div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
};

