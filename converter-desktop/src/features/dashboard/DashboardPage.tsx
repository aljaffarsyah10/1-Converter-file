import React from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { ToolCard } from "@/components/shared/ToolCard";
import { TOOLS_CATALOG } from "@/data/tools";
import { useAppStore } from "@/stores/useAppStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, ShieldCheck, Zap, HardDrive } from "lucide-react";

export const DashboardPage: React.FC = () => {
  const { navigateTo } = useAppStore();
  const coreTools = TOOLS_CATALOG.filter((tool) => tool.isAvailable);

  return (
    <PageContainer>
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-card to-background p-6 md:p-8">
        <div className="max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Zap className="w-3.5 h-3.5" /> Fast Local Engine
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Convert & Manage Documents Locally
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Merge, split, and convert documents and images without uploading your
            sensitive files to any online server. Everything stays on this PC.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Button
              size="sm"
              onClick={() => navigateTo("all-tools")}
              className="gap-1.5 text-xs shadow"
            >
              Explore All Tools <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Highlights / Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border shadow-none bg-card/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold">100% Offline & Private</p>
              <p className="text-[11px] text-muted-foreground">
                No telemetry or server uploads
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-none bg-card/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-600">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold">Native Rust Engine</p>
              <p className="text-[11px] text-muted-foreground">
                Sub-second local processing
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-none bg-card/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-600">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold">Non-Destructive</p>
              <p className="text-[11px] text-muted-foreground">
                Your original files are never altered
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Core P0 Tools Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Core MVP Tools</h2>
            <p className="text-xs text-muted-foreground">
              Ready-to-use document and PDF converters
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateTo("all-tools")}
            className="text-xs gap-1"
          >
            All Tools ({TOOLS_CATALOG.length}) <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {coreTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </div>
    </PageContainer>
  );
};
