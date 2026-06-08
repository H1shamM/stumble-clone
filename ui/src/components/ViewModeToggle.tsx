import { BookOpen, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ViewMode = "reader" | "live";

interface ViewModeToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export function ViewModeToggle({ mode, onChange }: ViewModeToggleProps) {
  return (
    <div className="flex rounded-md border p-1 bg-background">
      <Button
        variant={mode === "reader" ? "secondary" : "ghost"}
        size="sm"
        className="flex-1"
        onClick={() => onChange("reader")}
        aria-pressed={mode === "reader"}
      >
        <BookOpen className="mr-2 h-4 w-4" />
        Reader
      </Button>
      <Button
        variant={mode === "live" ? "secondary" : "ghost"}
        size="sm"
        className="flex-1"
        onClick={() => onChange("live")}
        aria-pressed={mode === "live"}
      >
        <Globe className="mr-2 h-4 w-4" />
        Live
      </Button>
    </div>
  );
}
