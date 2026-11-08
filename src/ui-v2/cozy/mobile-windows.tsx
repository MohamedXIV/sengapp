"use client";

import { useRef, useState, type PointerEvent } from "react";
import { GripIcon, Maximize2Icon, MessageCircleIcon, PaletteIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AppearancePanel } from "../shared/appearance-panel";
import { SharedConversationPanel } from "../shared/conversation-panel";
import { ShellSwitcher } from "../shared/shell-switcher";
import { ConversationListPanel } from "./conversation-list";

type Rect = { x: number; y: number; width: number; height: number };
type Gesture = { action: "drag" | "resize"; x: number; y: number; rect: Rect };
const MIN_WIDTH = 280;
const MIN_HEIGHT = 320;
const ROOM_MARGIN = 12;

function initialRect(): Rect {
  if (typeof window === "undefined") return { x: 12, y: 140, width: 358, height: 580 };
  const width = Math.max(MIN_WIDTH, window.innerWidth - ROOM_MARGIN * 2);
  const height = Math.max(MIN_HEIGHT, Math.min(window.innerHeight * .7, window.innerHeight - 140));
  return { x: ROOM_MARGIN, y: Math.max(65, window.innerHeight * .17), width, height };
}
function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

/** Touch-capable moving and sizing window, intentionally separate from the chat content. */
export function CozyMobileWindows() {
  const [rect, setRect] = useState<Rect>({ x: 12, y: 140, width: 358, height: 580 });
  const [visible, setVisible] = useState(true);
  const [chatsOpen, setChatsOpen] = useState(false);
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const gesture = useRef<Gesture | null>(null);

  function begin(action: Gesture["action"], event: PointerEvent<HTMLButtonElement>) {
    gesture.current = { action, x: event.clientX, y: event.clientY, rect };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function move(event: PointerEvent<HTMLButtonElement>) {
    const start = gesture.current;
    if (!start) return;
    const dx = event.clientX - start.x, dy = event.clientY - start.y;
    if (start.action === "drag") {
      setRect(previous => ({
        ...previous,
        x: clamp(start.rect.x + dx, 0, window.innerWidth - Math.min(160, previous.width)),
        y: clamp(start.rect.y + dy, 0, window.innerHeight - 80),
      }));
    } else {
      setRect(previous => ({
        ...previous,
        width: clamp(start.rect.width + dx, MIN_WIDTH, window.innerWidth - start.rect.x),
        height: clamp(start.rect.height + dy, MIN_HEIGHT, window.innerHeight - start.rect.y),
      }));
    }
  }
  function end() { gesture.current = null; }

  return (
    <div className="absolute inset-0 z-20" data-testid="cozy-mobile-windows" style={{ pointerEvents: "none" }}>
      <div className="pointer-events-auto absolute start-3 end-3 top-3 flex items-center justify-between gap-2">
        <span className="rounded-lg border bg-card/90 px-3 py-2 text-xs font-medium shadow-sm">
          ☀ Woodland room
        </span>
        <ShellSwitcher />
      </div>
      {visible && (
        <section
          data-testid="cozy-mobile-window"
          className="absolute flex min-h-0 flex-col overflow-hidden rounded-xl border bg-card"
          style={{
            left: rect.x, top: rect.y, width: rect.width, height: rect.height,
            boxShadow: "var(--sengapp-window-shadow)",
            pointerEvents: "auto", maxWidth: "calc(100vw - 24px)", maxHeight: "calc(100dvh - 160px)",
          }}
        >
          <div className="flex h-10 shrink-0 items-center gap-2 border-b bg-muted/80 px-2">
            <button
              type="button" aria-label="Drag chat window" className="flex size-8 touch-none items-center justify-center rounded hover:bg-accent"
              onPointerDown={event => begin("drag", event)} onPointerMove={move}
              onPointerUp={end} onPointerCancel={end}
            ><GripIcon className="size-4 text-muted-foreground" /></button>
            <span className="min-w-0 flex-1 truncate text-xs font-semibold">Conversation · dockable mobile preview</span>
            <Button size="icon" variant="ghost" aria-label="Fit chat window" className="size-8" onClick={() => setRect(initialRect())}>
              <Maximize2Icon className="size-4" />
            </Button>
            <Button size="icon" variant="ghost" aria-label="Close chat window" className="size-8" onClick={() => setVisible(false)}>
              <XIcon className="size-4" />
            </Button>
          </div>
          <div className="min-h-0 flex-1"><SharedConversationPanel embedded /></div>
          <button
            type="button" aria-label="Resize chat window"
            className="absolute bottom-0 end-0 z-10 flex size-9 touch-none items-end justify-end p-2 text-muted-foreground"
            onPointerDown={event => begin("resize", event)} onPointerMove={move}
            onPointerUp={end} onPointerCancel={end}
          ><GripIcon className="size-4 rotate-[-45deg]" /></button>
        </section>
      )}
      <div className="pointer-events-auto absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2 rounded-full border bg-card/95 p-2 shadow-lg">
        <Button type="button" variant="ghost" size="icon" aria-label="Open chats" onClick={() => setChatsOpen(true)}>
          <MessageCircleIcon />
        </Button>
        <Button type="button" variant="ghost" size="icon" aria-label="Open appearance" onClick={() => setAppearanceOpen(true)}>
          <PaletteIcon />
        </Button>
        {!visible && <Button type="button" variant="secondary" size="sm" onClick={() => setVisible(true)}>Open chat</Button>}
      </div>
      <Sheet open={chatsOpen} onOpenChange={setChatsOpen}>
        <SheetContent side="left" className="w-[min(85vw,330px)] p-0">
          <SheetHeader className="sr-only"><SheetTitle>Chats</SheetTitle><SheetDescription>Choose a conversation</SheetDescription></SheetHeader>
          <ConversationListPanel onSelect={() => setChatsOpen(false)} />
        </SheetContent>
      </Sheet>
      <Sheet open={appearanceOpen} onOpenChange={setAppearanceOpen}>
        <SheetContent side="right" className="w-[min(85vw,330px)] p-0">
          <SheetHeader className="sr-only"><SheetTitle>Appearance</SheetTitle><SheetDescription>Customize both shells</SheetDescription></SheetHeader>
          <AppearancePanel embedded />
        </SheetContent>
      </Sheet>
    </div>
  );
}
