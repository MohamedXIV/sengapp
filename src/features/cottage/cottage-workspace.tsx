"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { DockviewReact, themeLight, type DockviewApi, type DockviewReadyEvent } from "dockview-react";
import { ArrowLeft, Armchair, BookOpenText, Check, CloudMoon, Home, LayoutPanelLeft, MessageCircle, RotateCcw, Sun, Timer } from "lucide-react";
import { MobileWindowLayer, type MobilePanelName } from "./mobile-window-layer";
import { RoomCanvas } from "./room-canvas";
import { ChatsPanel, NotesPanel, FocusPanel } from "./workspace-panels";
import { INITIAL_ITEMS, STORAGE, parseRoom, type RoomItem, type LightPreset } from "./room-model";

const components = { chats: ChatsPanel, notes: NotesPanel, focus: FocusPanel };
type PanelName = keyof typeof components;
const PANELS: Record<PanelName, {title:string; width:number;height:number;left?:number;right?:number;top?:number;bottom?:number}> = {
  chats: { title: "Chats", width: 265, height: 360, left: 16, top: 82 },
  notes: { title: "Notes", width: 270, height: 285, right: 18, top: 82 },
  focus: { title: "Focus timer", width: 250, height: 210, right: 22, bottom: 18 },
};
const PANEL_IDS: PanelName[] = ["chats", "notes", "focus"];
const desktopQuery = "(min-width: 900px)";
function subscribeDesktop(callback: () => void) {
  const media = window.matchMedia(desktopQuery);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}
function desktopSnapshot() { return window.matchMedia(desktopQuery).matches; }

function addFloating(api: DockviewApi, name: PanelName) {
  const panel = PANELS[name];
  api.addPanel({
    id: name, component: name, title: panel.title,
    floating: { position: { ...(panel.left !== undefined ? { left: panel.left } : { right: panel.right! }),
      ...(panel.top !== undefined ? { top: panel.top } : { bottom: panel.bottom! }) },
      width: panel.width, height: panel.height },
    minimumWidth: 220, minimumHeight: 150,
  });
}

export function CottageWorkspace() {
  const [items, setItems] = useState<RoomItem[]>(INITIAL_ITEMS);
  const [editMode, setEditMode] = useState(false);
  const [light, setLight] = useState<LightPreset>("day");
  const [hovered, setHovered] = useState<string | null>(null);
  const desktop = useSyncExternalStore(subscribeDesktop, desktopSnapshot, () => false);
  const [mobilePanels, setMobilePanels] = useState<MobilePanelName[]>([]);
  const dockApi = useRef<DockviewApi | null>(null);
  const subscriptions = useRef<{ dispose(): void } | null>(null);
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [layoutMessage, setLayoutMessage] = useState("Move the furniture, or rearrange the windows.");

  useEffect(() => {
    queueMicrotask(() => {
      try { setItems(parseRoom(localStorage.getItem(STORAGE.furniture))); } catch { /* use defaults */ }
    });
  }, []);

  useEffect(() => () => {
    subscriptions.current?.dispose();
    if (persistTimer.current) clearTimeout(persistTimer.current);
  }, []);

  const changedItems = useCallback((next: RoomItem[]) => {
    setItems(next);
    try { localStorage.setItem(STORAGE.furniture, JSON.stringify(next)); } catch { /* session-only fallback */ }
  }, []);
  const changedHover = useCallback((label: string | null) => setHovered(label), []);
  const resetFurniture = () => changedItems(INITIAL_ITEMS.map(item => ({ ...item })));

  const saveLayout = useCallback(() => {
    if (!dockApi.current) return;
    try { localStorage.setItem(STORAGE.windows, JSON.stringify(dockApi.current.toJSON())); } catch { /* memory-only fallback */ }
  }, []);
  const onDockReady = useCallback((event: DockviewReadyEvent) => {
    const api = event.api;
    dockApi.current = api;
    let restored = false;
    try {
      const value = localStorage.getItem(STORAGE.windows);
      if (value) { api.fromJSON(JSON.parse(value), { reuseExistingPanels: false }); restored = true; }
    } catch {
      try { api.clear(); } catch { /* freshly created instance */ }
    }
    if (!restored) for (const name of PANEL_IDS) addFloating(api, name);
    subscriptions.current?.dispose();
    subscriptions.current = api.onDidLayoutChange(() => {
      if (persistTimer.current) clearTimeout(persistTimer.current);
      persistTimer.current = setTimeout(saveLayout, 300);
    });
  }, [saveLayout]);

  function showPanel(name: PanelName) {
    if (!desktop) { activateMobile(name); return; }
    const api = dockApi.current;
    if (!api) return;
    const existing = api.getPanel(name);
    if (existing) existing.api.setActive();
    else addFloating(api, name);
  }
  function activateMobile(name: MobilePanelName) {
    setMobilePanels(current => [...current.filter(panel => panel !== name), name]);
  }
  function closeMobile(name: MobilePanelName) {
    setMobilePanels(current => current.filter(panel => panel !== name));
  }
  function resetWindows() {
    if (!desktop || !dockApi.current) return;
    try { localStorage.removeItem(STORAGE.windows); } catch {}
    const api = dockApi.current;
    api.clear();
    for (const name of PANEL_IDS) addFloating(api, name);
    setLayoutMessage("Windows reset to the cozy default.");
  }

  return <main className="cottage-lab min-h-dvh bg-[#e7f0e8] text-[#263d36]">
    <header className="cottage-toolbar relative z-30 flex min-h-16 flex-wrap items-center justify-between gap-2 border-b border-[#bfd1bd] px-3 py-2 sm:px-5">
      <div className="flex items-center gap-3">
        <Link href="/home" className="cottage-icon-button" aria-label="Back to Sengapp"><ArrowLeft className="size-4" /></Link>
        <span className="flex size-9 items-center justify-center rounded-2xl bg-[#cfe6ce]"><Home className="size-5"/></span>
        <div><strong className="block text-sm tracking-tight">Sengapp • Cottage Lab</strong><span className="block text-[11px] text-[#657e70]">An isolated, playable workspace experiment</span></div>
      </div>
      <nav aria-label="Workspace tools" className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        <button className="cottage-tool" aria-label="Chats" onClick={() => showPanel("chats")}><MessageCircle className="size-4"/><span className="hidden sm:inline">Chats</span></button>
        <button className="cottage-tool" aria-label="Notes" onClick={() => showPanel("notes")}><BookOpenText className="size-4"/><span className="hidden sm:inline">Notes</span></button>
        <button className="cottage-tool" aria-label="Focus" onClick={() => showPanel("focus")}><Timer className="size-4"/><span className="hidden sm:inline">Focus</span></button>
        <span className="mx-1 hidden h-6 w-px bg-[#bdd3c4] sm:block"/>
        <button aria-pressed={editMode} className={`cottage-tool ${editMode ? "cottage-active" : ""}`} onClick={() => setEditMode(value => !value)}>
          {editMode ? <Check className="size-4" /> : <Armchair className="size-4"/>}<span>{editMode ? "Done" : "Edit room"}</span>
        </button>
        <button aria-label={light === "day" ? "Evening" : "Day"} className="cottage-tool" onClick={() => setLight(value => value === "day" ? "evening" : "day")}>
          {light === "day" ? <CloudMoon className="size-4"/> : <Sun className="size-4"/>}<span className="hidden sm:inline">{light === "day" ? "Evening" : "Day"}</span>
        </button>
      </nav>
    </header>

    <section className="cottage-stage relative mx-auto h-[calc(100dvh-65px)] min-h-[560px] overflow-hidden">
      <div className="cottage-stage-background absolute inset-0" aria-hidden="true"/>
      <div className="cottage-stage-center absolute inset-0 flex items-center justify-center px-1 pb-12">
        <RoomCanvas items={items} editing={editMode} light={light} onChange={changedItems} onHover={changedHover}/>
      </div>
      <aside className="pointer-events-none absolute bottom-4 left-4 z-20 max-w-[70%] rounded-2xl border border-[#c3d2c2] bg-[#fffaf0ed] px-4 py-2 text-xs shadow-sm">
        <span className="block font-bold">{hovered ?? (editMode ? "Edit mode · drag sprites to new tiles" : "Your little forest cottage")}</span>
        <span className="block text-[#63796e]">{editMode ? "7 movable decorations · collision-aware soft grid" : "Three layers: shell · furniture · gentle lighting"}</span>
      </aside>
      <div className="absolute bottom-4 right-4 z-20 flex gap-2">
        <button className="cottage-tool bg-white/90" onClick={resetFurniture} title="Reset furniture"><RotateCcw className="size-4"/> <span className="hidden sm:inline">Reset room</span></button>
        {desktop && <button className="cottage-tool bg-white/90" onClick={resetWindows} title="Reset Dockview windows"><LayoutPanelLeft className="size-4"/> <span className="hidden sm:inline">Reset windows</span></button>}
      </div>
      {desktop && <div className="cottage-dock-layer absolute inset-0 z-10" aria-label="Floating workspace windows">
        <DockviewReact className="cottage-dock" theme={themeLight} components={components}
          floatingGroupDragHandle="titlebar" onReady={onDockReady}/>
      </div>}
      {!desktop && <MobileWindowLayer openPanels={mobilePanels} onActivate={activateMobile} onClose={closeMobile}/>} 
      <span className="sr-only" role="status">{layoutMessage}</span>
    </section>
  </main>;
}
