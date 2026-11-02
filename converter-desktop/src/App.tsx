import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/stores/useAppStore";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");
  const { currentTool, setCurrentTool } = useAppStore();

  async function greet() {
    try {
      setGreetMsg(await invoke("greet", { name }));
    } catch (err) {
      setGreetMsg(`Rust invoke (dev mode): ${String(err)}`);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6">
      <Card className="w-full max-w-md shadow-lg border">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">File Converter Desktop</CardTitle>
          <CardDescription>
            Frontend Foundation (Tailwind CSS + shadcn/ui + Zustand)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              greet();
            }}
            className="flex items-center gap-2"
          >
            <Input
              id="greet-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter a name..."
              className="flex-1"
            />
            <Button type="submit">Greet</Button>
          </form>

          {greetMsg && (
            <p className="text-sm font-medium text-muted-foreground text-center bg-muted/50 p-2 rounded">
              {greetMsg}
            </p>
          )}

          <div className="pt-2 border-t text-xs text-muted-foreground flex justify-between items-center">
            <span>Zustand active tool:</span>
            <span className="font-mono bg-secondary px-2 py-0.5 rounded text-secondary-foreground">
              {currentTool || "None"}
            </span>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => setCurrentTool("Merge PDF")}
            >
              Test State: Merge PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => setCurrentTool(null)}
            >
              Reset State
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default App;
