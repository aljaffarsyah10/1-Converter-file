import React, { useEffect, useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { useAppStore } from "@/stores/useAppStore";
import { useConversionStore } from "@/stores/useConversionStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Moon, Sun, Monitor, HardDrive, Info, Cpu, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { getSystemEngineInfo, pickDirectory } from "@/services/tauriConversionService";
import { SystemEngineInfo } from "@/types/conversion";

export const SettingsPage: React.FC = () => {
  const { theme, setTheme, defaultOutputPath, setDefaultOutputPath } = useAppStore();
  const { setOutputDir } = useConversionStore();
  const [engineInfo, setEngineInfo] = useState<SystemEngineInfo | null>(null);

  useEffect(() => {
    getSystemEngineInfo().then((info) => setEngineInfo(info));
  }, []);

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

  const handleBrowseFolder = async () => {
    try {
      const selected = await pickDirectory(defaultOutputPath);
      if (selected) {
        setDefaultOutputPath(selected);
        setOutputDir(selected);
        toast.success("Folder output default berhasil diperbarui", {
          description: selected,
        });
      }
    } catch (err: any) {
      toast.error("Gagal memilih folder", {
        description: err?.message || String(err),
      });
    }
  };

  return (
    <PageContainer>
      <div className="max-w-3xl space-y-6">
        {/* Appearance Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Tampilan (Appearance)</CardTitle>
            <CardDescription className="text-xs">
              Sesuaikan preferensi tema visual aplikasi
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium">Tema Warna</p>
                <p className="text-[11px] text-muted-foreground">
                  Pilih Terang (Light), Gelap (Dark), atau mengikuti tema sistem Windows
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
            <CardTitle className="text-base font-semibold">Penyimpanan & Berkas</CardTitle>
            <CardDescription className="text-xs">
              Atur lokasi folder default untuk menyimpan dokumen hasil konversi
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Folder Output Default</label>
              <div className="flex gap-2">
                <Input
                  value={defaultOutputPath}
                  onChange={(e) => {
                    setDefaultOutputPath(e.target.value);
                    setOutputDir(e.target.value);
                  }}
                  className="text-xs h-8 font-mono"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs shrink-0"
                  onClick={handleBrowseFolder}
                >
                  <HardDrive className="w-3.5 h-3.5 mr-1" /> Browse
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Dokumen hasil konversi akan disimpan ke direktori ini secara default.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* System Engine Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-primary" />
              <CardTitle className="text-base font-semibold">Status Engine Konversi</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Deteksi engine offline lokal untuk fitur Word to PDF (DOCX)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/40">
              <div className="space-y-0.5">
                <p className="font-medium text-foreground">Microsoft Word COM Automation</p>
                <p className="text-[11px] text-muted-foreground">
                  Engine native Windows untuk konversi dokumen Word dengan presisi layout 100%
                </p>
              </div>
              {engineInfo?.word_com_available ? (
                <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium bg-emerald-500/10 px-2.5 py-1 rounded-md">
                  <CheckCircle2 className="w-4 h-4" /> Tersedia
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs text-amber-600 font-medium bg-amber-500/10 px-2.5 py-1 rounded-md">
                  <AlertCircle className="w-4 h-4" /> Tidak Terdeteksi
                </span>
              )}
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/40">
              <div className="space-y-0.5">
                <p className="font-medium text-foreground">LibreOffice CLI Headless</p>
                <p className="text-[11px] text-muted-foreground">
                  Engine open-source alternatif (soffice.exe)
                  {engineInfo?.libreoffice_path ? ` — ${engineInfo.libreoffice_path}` : ""}
                </p>
              </div>
              {engineInfo?.libreoffice_available ? (
                <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium bg-emerald-500/10 px-2.5 py-1 rounded-md">
                  <CheckCircle2 className="w-4 h-4" /> Tersedia
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium bg-muted px-2.5 py-1 rounded-md">
                  Opsional (Fallback)
                </span>
              )}
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/40">
              <div className="space-y-0.5">
                <p className="font-medium text-foreground">Native Rust Engine (lopdf + image)</p>
                <p className="text-[11px] text-muted-foreground">
                  Engine zero-dependency mandiri untuk Merge PDF, Split PDF, dan Image to PDF
                </p>
              </div>
              <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium bg-emerald-500/10 px-2.5 py-1 rounded-md">
                <CheckCircle2 className="w-4 h-4" /> Bawaan Aplikasi
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Architecture Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <CardTitle className="text-base font-semibold">Privasi & Keamanan</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Jaminan pemrosesan lokal sejalan dengan PRD
            </CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-2">
            <p>
              • <strong>Zero Cloud Uploads:</strong> Seluruh pemrosesan dokumen dan gambar
              berjalan secara lokal di CPU & RAM komputer ini.
            </p>
            <p>
              • <strong>Tanpa Telemetri:</strong> Tidak ada analitik, pelacakan, atau transmisi
              data ke jaringan internet.
            </p>
            <p>
              • <strong>Non-Destructive:</strong> Berkas sumber input hanya dibuka dalam mode
              read-only dan tidak akan pernah diubah atau dihapus.
            </p>
          </CardContent>
        </Card>

        {/* About & Version Info */}
        <Card className="bg-muted/30">
          <CardHeader className="py-3 px-4">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-muted-foreground" />
              <CardTitle className="text-xs font-medium">Tentang File Converter Desktop</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-4 py-2 text-[11px] text-muted-foreground space-y-1 font-mono">
            <div>Versi: 1.0.0 (Tauri 2 + React + Rust)</div>
            <div>Platform: Windows 10/11 64-bit</div>
            <div>Arsitektur: Offline-First Desktop</div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
};
