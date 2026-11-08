"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MessageCircleIcon, PaletteIcon, RefreshCcwIcon } from "lucide-react";
import {
  DockviewReact, type DockviewApi, type DockviewReadyEvent,
} from "dockview-react";
import { Button } from "@/components/ui/button";
import { RoomCanvas } from "@/features/cottage/room-canvas";
import { INITIAL_ITEMS } from "@/features/cottage/room-model";
import { AppearancePanel } from "../shared/appearance-panel";
import { SharedConversationPanel } from "../shared/conversation-panel";
import { ShellSwitcher } from "../shared/shell-switcher";
import { ConversationListPanel } from "./conversation-list";
import { CozyMobileWindows } from "./mobile-windows";

type PanelId = "chats" | "conversation" | "appearance";
const panels = {
  chats: () => <ConversationListPanel />,
  conversation: () => <SharedConversationPanel embedded />,
  appearance: () => <AppearancePanel embedded />,
};

function initialFloating(id: PanelId, width: number, height: number) {
  const padding = 18;
  if (id === "chats") {
    return {
      position: { left: padding, top: Math.max(68, height * .15) },
      width: Math.min(290, width * .27), height: Math.min(570, height * .72),
    };
  }
  if (id === "appearance") {
    return {
      position: { left: Math.max(20, width - 292 - padding), top: Math.max(120, height * .26) },
      width: 292, height: Math.min(430, height * .62),
    };
  }
  const conversationWidth = Math.min(760, Math.max(480, width * .56));
  return {
    position: { left: Math.max(180, (width - conversationWidth) / 2 - 18), top: 64 },
    width: conversationWidth, height: Math.min(height - 104, 790),
  };
}

function addFloating(api: DockviewApi, id: PanelId) {
  const existing = api.getPanel(id);
  if (existing) { existing.api.setActive(); return; }
  const bounds = initialFloating(id, window.innerWidth, window.innerHeight);
  api.addPanel({
    id, component: id,
    title: id === "chats" ? "Chats" : id === "conversation" ? "Conversation" : "Appearance",
    floating: bounds,
    minimumWidth: id === "conversation" ? 340 : 220,
    minimumHeight: id === "conversation" ? 330 : 230,
  });
}

function CozyWorld() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_42%_20%,#fff1d4_0%,#e4ecdf_54%,#cddbcf_100%)]" />
      <RoomCanvas
        items={INITIAL_ITEMS} editing={false} light="day"
        onChange={() => {}} onHover={() => {}} onViewChange={() => {}}
      />
    </div>
  );
}

/** Phaser owns the world; Dockview owns only independent window placement and tabs. */
export function CozyShell() {
  const [desktop, setDesktop] = useState(false);
  const apiRef = useRef<DockviewApi | null>(null);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const update = () => setDesktop(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const onReady = useCallback((event: DockviewReadyEvent) => {
    apiRef.current = event.api;
    for (const id of ["chats", "conversation", "appearance"] as const) {
      addFloating(event.api, id);
    }
  }, []);

  const resetWindows = () => {
    const api = apiRef.current;
    if (!api) return;
    api.clear();
    for (const id of ["chats", "conversation", "appearance"] as const) addFloating(api, id);
  };

  return (
    <section data-testid="cozy-shell" className="sengapp-cozy-stage relative h-dvh w-full overflow-hidden">
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
            <div className="pointer-events-auto rounded-xl border bg-card/90 px-4 py-2 text-sm font-medium shadow-sm">
              ☀ Woodland room
            </div>
            <div className="pointer-events-auto flex flex-wrap gap-2 rounded-xl border bg-card/90 p-1 shadow-sm">
              <Button aria-label="Show chats window" variant="ghost" size="icon" onClick={() => apiRef.current && addFloating(apiRef.current, "chats")}>
                <MessageCircleIcon className="size-4" />
              </Button>
              <Button aria-label="Show appearance window" variant="ghost" size="icon" onClick={() => apiRef.current && addFloating(apiRef.current, "appearance")}>
                <PaletteIcon className="size-4" />
              </Button>
              <Button aria-label="Reset floating windows" variant="ghost" size="icon" onClick={resetWindows}>
                <RefreshCcwIcon className="size-4" />
              </Button>
              <ShellSwitcher />
            </div>
          </div>
        </>
      ) : <CozyMobileWindows />}
    </section>
  );
}
