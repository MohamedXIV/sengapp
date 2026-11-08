"use client";

import { HouseIcon, LayoutPanelLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "./workspace-state";

export function ShellSwitcher() {
  const { shell, setShell } = useWorkspace();
  return (
    <div data-testid="shell-switcher" className="flex items-center gap-1 rounded-lg border bg-card/90 p-1">
      <Button
        aria-label="Switch to Classic" aria-pressed={shell === "classic"}
        variant={shell === "classic" ? "secondary" : "ghost"} size="sm"
        onClick={() => setShell("classic")}
      ><LayoutPanelLeftIcon className="size-4" /><span className="hidden sm:inline">Classic</span></Button>
      <Button
        aria-label="Switch to Cozy" aria-pressed={shell === "cozy"}
        variant={shell === "cozy" ? "secondary" : "ghost"} size="sm"
        onClick={() => setShell("cozy")}
      ><HouseIcon className="size-4" /><span className="hidden sm:inline">Cozy</span></Button>
    </div>
  );
}
