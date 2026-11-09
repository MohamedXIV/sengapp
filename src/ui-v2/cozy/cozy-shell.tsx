"use client";

import { useCallback, useRef, useState } from "react";
import { HouseIcon, MaximizeIcon, MessageCircleIcon, RefreshCcwIcon } from "lucide-react";
import { DockviewReact, type DockviewApi, type DockviewReadyEvent } from "dockview-react";
import { Button } from "@/components/ui/button";
import { RoomCanvas } from "@/features/cottage/room-canvas";
import { INITIAL_ITEMS } from "@/features/cottage/room-model";
import { AppearanceDrawer, AppearanceToggle } from "../shared/appearance-drawer";
import { SharedConversationPanel } from "../shared/conversation-panel";
import { ShellSwitcher } from "../shared/shell-switcher";
import { useDesktopLayout } from "../shared/use-desktop-layout";
import { ConversationListPanel } from "./conversation-list";
import { CozyMobileWindows } from "./mobile-windows";

type PanelId = "chats" | "conversation";
const panels = {
  chats: () => <ConversationListPanel />,
  conversation: () => <SharedConversationPanel embedded />,
};
const WINDOW_GAP = 22;

function windowBounds(id: PanelId, width: number, height: number) {
  if (id === "chats") {
    const panelWidth = Math.min(286, Math.max(224, width * .25));
    return {
      position: { left: WINDOW_GAP, top: Math.max(100, height * .18) },
      width: panelWidth,
      height: Math.min(510, height * .65),
    };
  }
  const panelWidth = Math.min(640, Math.max(420, width * .49));
  const left = Math.max(
    22,
    Math.min(width - panelWidth - WINDOW_GAP, Math.max(330, width * .51)),
  );
  return {
    position: { left, top: Math.max(78, height * .11) },
    width: panelWidth,
    height: Math.min(700, height - 128),
  };
}

function addFloating(api: DockviewApi, id: PanelId, width: number, height: number) {
  const existing = api.getPanel(id);
  if (existing) { existing.api.setActive(); return; }
  api.addPanel({
    id, component: id, title: id === "chats" ? "Chats" : "Conversation",
    floating: windowBounds(id, width, height),
    minimumWidth: id === "conversation" ? 320 : 220,
    minimumHeight: id === "conversation" ? 320 : 220,
  });
}

/** Real Phaser background, with a static copy of its existing room art ONLY while it loads. */
function CozyWorld() {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="absolute inset-0 overflow-hidden" data-testid="cozy-world">
      <div className="sengapp-cozy-ambient absolute inset-0" aria-hidden="true" />
      {!loaded && (
        <div
          data-testid="cozy-room-fallback"
          className="sengapp-cozy-room-fallback pointer-events-none absolute inset-0"
          aria-hidden="true"
        />
      )}
      <RoomCanvas
        items={INITIAL_ITEMS} editing={false} light="day"
        onReady={() => setLoaded(true)}
        onChange={() => {}} onHover={() => {}} onViewChange={() => {}}
      />
    </div>
  );
}

/** Desktop matches mobile's quiet, touch-friendly window look; Dockview still does docking. */
export function CozyShell() {
  const desktop = useDesktopLayout();
  const apiRef = useRef<DockviewApi | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const onReady = useCallback((event: DockviewReadyEvent) => {
    apiRef.current = event.api;
    const width = stageRef.current?.clientWidth ?? window.innerWidth;
    const height = stageRef.current?.clientHeight ?? window.innerHeight;
    addFloating(event.api, "chats", width, height);
    addFloating(event.api, "conversation", width, height);
  }, []);

  function showChats() {
    if (!apiRef.current) return;
    addFloating(apiRef.current, "chats",
      stageRef.current?.clientWidth ?? window.innerWidth,
      stageRef.current?.clientHeight ?? window.innerHeight);
  }
  function resetWindows() {
    const api = apiRef.current;
    if (!api) return;
    api.clear();
    const width = stageRef.current?.clientWidth ?? window.innerWidth;
    const height = stageRef.current?.clientHeight ?? window.innerHeight;
    addFloating(api, "chats", width, height);
    addFloating(api, "conversation", width, height);
  }

  return (
    <section data-testid="cozy-shell" className="flex h-dvh w-full overflow-hidden">
      <div ref={stageRef} data-testid="cozy-world-stage"
        className="sengapp-cozy-stage relative min-w-0 flex-1 overflow-hidden">
        <CozyWorld />
        {desktop ? (
          <>
            <div className="pointer-events-none absolute inset-0 z-10">
              <div className="sengapp-cozy-dock h-full w-full" data-testid="cozy-dockview">
                <DockviewReact
                  className="dockview-theme-light h-full w-full"
                  onReady={onReady}
                  components={panels}
                />
              </div>
            </div>
            <div className="pointer-events-none absolute inset-x-4 top-4 z-20 flex items-start justify-between gap-3">
              <div className="pointer-events-auto flex items-center gap-2 rounded-xl border bg-card/90 px-3 py-2 text-sm font-medium shadow-sm">
                <HouseIcon className="size-4 text-primary" /> Woodland room
              </div>
              <div className="pointer-events-auto flex flex-wrap items-center gap-1 rounded-xl border bg-card/95 p-1 shadow-sm">
                <Button
                  type="button" aria-label="Show chats window" variant="ghost" size="icon"
                  onClick={showChats}
                ><MessageCircleIcon className="size-4" /></Button>
                <Button
                  type="button" aria-label="Reset floating windows" variant="ghost" size="icon"
                  onClick={resetWindows}
                ><MaximizeIcon className="size-4" /></Button>
                <AppearanceToggle />
                <ShellSwitcher />
              </div>
            </div>
            <div className="pointer-events-none absolute bottom-4 left-4 z-20">
              <div className="pointer-events-auto rounded-full border bg-card/85 px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
                <RefreshCcwIcon className="me-1 inline size-3" />
                Drag a tab to dock · use the window edges to resize
              </div>
            </div>
          </>
        ) : <CozyMobileWindows />}
      </div>
      <AppearanceDrawer />
    </section>
  );
}
