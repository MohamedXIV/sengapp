"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Grip, X } from "lucide-react";
import { ChatsPanel, FocusPanel, NotesPanel } from "./workspace-panels";

export type MobilePanelName = "chats" | "notes" | "focus";
export type MobileWindowBounds = { x: number; y: number; width: number; height: number };

const STORAGE_KEY = "sengapp-lab-mobile-windows-v1";
const MARGIN = 10;
const MIN_WIDTH = 236;
const MIN_HEIGHT = 174;
const DEFAULT_WIDTH = 312;
const DEFAULT_HEIGHT = 300;
const LABELS: Record<MobilePanelName, string> = {
  chats: "Chats", notes: "Notes", focus: "Focus timer",
};
const DEFAULTS: Record<MobilePanelName, MobileWindowBounds> = {
  chats: { x: 14, y: 45, width: DEFAULT_WIDTH, height: 290 },
  notes: { x: 30, y: 105, width: DEFAULT_WIDTH, height: 280 },
  focus: { x: 52, y: 170, width: 265, height: 218 },
};

const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), Math.max(min, max));

export function constrainWindow(box: MobileWindowBounds, stage: { width: number; height: number }): MobileWindowBounds {
  const width = clamp(box.width, Math.min(MIN_WIDTH, stage.width - MARGIN * 2), stage.width - MARGIN * 2);
  const height = clamp(box.height, Math.min(MIN_HEIGHT, stage.height - MARGIN * 2), stage.height - MARGIN * 2);
  return {
    x: clamp(box.x, MARGIN, stage.width - width - MARGIN),
    y: clamp(box.y, MARGIN, stage.height - height - MARGIN),
    width, height,
  };
}

function parseSaved(raw: string | null): Partial<Record<MobilePanelName, MobileWindowBounds>> {
  if (!raw) return {};
  try {
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== "object" || Array.isArray(data)) return {};
    const fields = data as Record<string, unknown>;
    const result: Partial<Record<MobilePanelName, MobileWindowBounds>> = {};
    for (const name of Object.keys(LABELS) as MobilePanelName[]) {
      const box = fields[name];
      if (!box || typeof box !== "object" || Array.isArray(box)) continue;
      const b = box as Record<string, unknown>;
      if (["x", "y", "width", "height"].every(key =>
        typeof b[key] === "number" && Number.isFinite(b[key]))) {
        result[name] = { x: b.x as number, y: b.y as number, width: b.width as number, height: b.height as number };
      }
    }
    return result;
  } catch { return {}; }
}

type Gesture = {
  name: MobilePanelName;
  pointerId: number;
  kind: "move" | "resize";
  clientX: number;
  clientY: number;
  initial: MobileWindowBounds;
};

export function MobileWindowLayer({
  openPanels, onClose, onActivate,
}: {
  openPanels: MobilePanelName[];
  onClose(name: MobilePanelName): void;
  onActivate(name: MobilePanelName): void;
}) {
  const layer = useRef<HTMLDivElement>(null);
  const gesture = useRef<Gesture | null>(null);
  const [stage, setStage] = useState({ width: 390, height: 650 });
  const [positions, setPositions] = useState<Partial<Record<MobilePanelName, MobileWindowBounds>>>({});
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    const el = layer.current;
    if (!el) return;
    const observer = new ResizeObserver(entries => {
      const rect = entries[0]?.contentRect;
      if (rect) setStage({ width: rect.width, height: rect.height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      try { setPositions(parseSaved(localStorage.getItem(STORAGE_KEY))); } catch { /* storage disabled */ }
      setRestored(true);
    });
  }, []);

  useEffect(() => {
    if (!restored) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(positions)); } catch { /* session only */ }
  }, [positions, restored]);

  function start(event: ReactPointerEvent<HTMLButtonElement>, name: MobilePanelName, kind: Gesture["kind"]) {
    if (!event.isPrimary || event.button !== 0) return;
    const initial = constrainWindow(positions[name] ?? DEFAULTS[name], stage);
    gesture.current = {
      name, kind, pointerId: event.pointerId, clientX: event.clientX, clientY: event.clientY, initial,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    onActivate(name);
    event.preventDefault();
  }

  function move(event: ReactPointerEvent<HTMLButtonElement>) {
    const current = gesture.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const dx = event.clientX - current.clientX;
    const dy = event.clientY - current.clientY;
    const next = current.kind === "move"
      ? { ...current.initial, x: current.initial.x + dx, y: current.initial.y + dy }
      : { ...current.initial, width: current.initial.width + dx, height: current.initial.height + dy };
    const constrained = constrainWindow(next, stage);
    setPositions(previous => ({ ...previous, [current.name]: constrained }));
  }

  function finish(event: ReactPointerEvent<HTMLButtonElement>) {
    if (gesture.current?.pointerId !== event.pointerId) return;
    gesture.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function nudge(name: MobilePanelName, dx: number, dy: number) {
    setPositions(previous => {
      const current = constrainWindow(previous[name] ?? DEFAULTS[name], stage);
      return { ...previous, [name]: constrainWindow({ ...current, x: current.x + dx, y: current.y + dy }, stage) };
    });
  }

  return <div ref={layer} className="cottage-mobile-layer pointer-events-none absolute inset-0 z-30" data-testid="cottage-mobile-layer">
    {openPanels.map((name, order) => {
      const box = constrainWindow(positions[name] ?? DEFAULTS[name], stage);
      return <section key={name} data-testid={`cottage-mobile-window-${name}`}
        className="cottage-mobile-window pointer-events-auto absolute flex flex-col overflow-hidden rounded-[20px] border border-[#bdccbd] bg-[#fffcf4] shadow-[0_16px_45px_#32483c40]"
        style={{ left: box.x, top: box.y, width: box.width, height: box.height, zIndex: order + 1 }}
        aria-label={LABELS[name]} onPointerDown={() => onActivate(name)}>
        <div className="cottage-mobile-titlebar flex h-11 shrink-0 items-center gap-1.5 border-b border-[#c8d5c4] bg-[#dcebe0] px-2">
          <button className="cottage-mobile-drag flex h-10 min-w-0 flex-1 touch-none select-none items-center gap-2 rounded-lg px-2 text-start text-sm font-bold"
            aria-label={`Move ${LABELS[name]} window`}
            title="Drag to move · Arrow keys also move the window"
            onPointerDown={event => start(event, name, "move")}
            onPointerMove={move} onPointerUp={finish} onPointerCancel={finish}
            onKeyDown={event => {
              if (event.key === "ArrowLeft") { event.preventDefault(); nudge(name, -16, 0); }
              if (event.key === "ArrowRight") { event.preventDefault(); nudge(name, 16, 0); }
              if (event.key === "ArrowUp") { event.preventDefault(); nudge(name, 0, -16); }
              if (event.key === "ArrowDown") { event.preventDefault(); nudge(name, 0, 16); }
            }}>
            <Grip className="size-4 shrink-0 text-[#729280]" aria-hidden="true"/>
            <span className="truncate">{LABELS[name]}</span>
          </button>
          <button className="flex size-9 shrink-0 items-center justify-center rounded-lg hover:bg-[#c5decf] focus-visible:outline-2 focus-visible:outline-[#45785e]"
            aria-label={`Close ${LABELS[name]} window`} onClick={() => onClose(name)}><X className="size-4"/></button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto overscroll-contain">
          {name === "chats" ? <ChatsPanel /> : name === "notes" ? <NotesPanel /> : <FocusPanel />}
        </div>
        <button aria-label={`Resize ${LABELS[name]} window`}
          title="Drag to resize" className="cottage-mobile-resize absolute bottom-0 right-0 flex size-9 touch-none select-none items-end justify-end rounded-br-[19px] p-1.5 text-[#71927b]"
          onPointerDown={event => start(event, name, "resize")} onPointerMove={move} onPointerUp={finish} onPointerCancel={finish}>
          <Grip className="size-4 rotate-45" aria-hidden="true"/>
        </button>
      </section>;
    })}
  </div>;
}
