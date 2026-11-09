"use client";

import { PaletteIcon, SparklesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AppearancePanel } from "./appearance-panel";
import { CompanionSettingsPanel } from "./companion-settings-panel";
import { useWorkspace } from "./workspace-state";

/** One shadcn overlay Sheet on all screen sizes; no desktop layout shrink. */
export function AppearanceDrawer() {
  const { rightPanelOpen, setRightPanelOpen, rightPanelSection, openRightPanel } = useWorkspace();
  return (
    <Sheet open={rightPanelOpen} onOpenChange={setRightPanelOpen}>
      <SheetContent side="right" data-testid="utility-right-drawer"
        className="flex h-dvh w-[min(92vw,390px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[390px]">
        <SheetHeader className="shrink-0 border-b px-5 pb-4 pt-5 pe-12 text-start">
          <SheetTitle>Your space</SheetTitle>
          <SheetDescription>Make Sengapp feel like yours.</SheetDescription>
        </SheetHeader>
        <div role="group" aria-label="Settings sections" className="grid shrink-0 grid-cols-2 gap-2 border-b p-3">
          <Button type="button" size="sm" variant={rightPanelSection === "appearance" ? "secondary" : "ghost"}
            aria-pressed={rightPanelSection === "appearance"} onClick={() => openRightPanel("appearance")}>
            <PaletteIcon className="size-4" /> Appearance
          </Button>
          <Button type="button" size="sm" variant={rightPanelSection === "companion" ? "secondary" : "ghost"}
            aria-pressed={rightPanelSection === "companion"} onClick={() => openRightPanel("companion")}>
            <SparklesIcon className="size-4" /> Companion
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {rightPanelSection === "appearance" ? <AppearancePanel embedded /> : <CompanionSettingsPanel />}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function AppearanceToggle() {
  const { rightPanelOpen, rightPanelSection, setRightPanelOpen, openRightPanel } = useWorkspace();
  const expanded = rightPanelOpen && rightPanelSection === "appearance";
  return (
    <Button variant={expanded ? "secondary" : "ghost"} size="icon" type="button"
      aria-label="Toggle preferences drawer" aria-expanded={rightPanelOpen}
      onClick={() => expanded ? setRightPanelOpen(false) : openRightPanel("appearance")}>
      <PaletteIcon className="size-4" />
    </Button>
  );
}
