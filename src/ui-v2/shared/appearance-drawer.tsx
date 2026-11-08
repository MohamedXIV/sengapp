"use client";

import { PanelRightCloseIcon, PaletteIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AppearancePanel } from "./appearance-panel";
import { useDesktopLayout } from "./use-desktop-layout";
import { useWorkspace } from "./workspace-state";

/** Desktop: a real flex sibling that PUSHES content. Mobile: the familiar shadcn Sheet. */
export function AppearanceDrawer() {
  const { appearanceOpen, setAppearanceOpen } = useWorkspace();
  const desktop = useDesktopLayout();

  if (!desktop) {
    return (
      <Sheet open={appearanceOpen} onOpenChange={setAppearanceOpen}>
        <SheetContent side="right" className="w-[min(88vw,340px)] overflow-y-auto p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Appearance</SheetTitle>
            <SheetDescription>Customize the shared Sengapp appearance.</SheetDescription>
          </SheetHeader>
          <AppearancePanel embedded />
        </SheetContent>
      </Sheet>
    );
  }

  if (!appearanceOpen) return null;

  return (
    <aside
      data-testid="appearance-right-sidebar"
      aria-label="Appearance"
      className="flex h-full w-[320px] min-w-[280px] shrink-0 flex-col overflow-hidden border-s bg-card"
    >
      <div className="flex h-11 shrink-0 items-center justify-between border-b px-4">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <PaletteIcon className="size-4" /> Customize
        </div>
        <Button
          type="button" variant="ghost" size="icon" className="size-8"
          aria-label="Close appearance sidebar"
          onClick={() => setAppearanceOpen(false)}
        ><PanelRightCloseIcon className="size-4" /></Button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <AppearancePanel embedded />
      </div>
    </aside>
  );
}

export function AppearanceToggle() {
  const { appearanceOpen, setAppearanceOpen } = useWorkspace();
  return (
    <Button
      variant={appearanceOpen ? "secondary" : "ghost"}
      size="icon"
      type="button"
      aria-label="Toggle appearance sidebar"
      aria-expanded={appearanceOpen}
      onClick={() => setAppearanceOpen(!appearanceOpen)}
    ><PaletteIcon className="size-4" /></Button>
  );
}
