"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { WorkspaceAuthEntry } from "./workspace-auth-entry";
import { ExperienceSwitch } from "@/components/experience/experience-switch";
import { validConversationId } from "@/lib/experience";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { DockviewReact, themeLight, type DockviewApi, type DockviewReadyEvent } from "dockview-react";
import { Armchair, BookOpenText, Check, CloudMoon, Home, LayoutPanelLeft, MessageCircle, UsersRound, Palette, Settings2, Settings, RotateCcw, Sun, Timer, ZoomIn, ZoomOut, Scan, Maximize2, SlidersHorizontal } from "lucide-react";
import { MobileWindowLayer, type MobilePanelName } from "./mobile-window-layer";
import { RoomCanvas, type RoomCanvasHandle } from "./room-canvas";
import { CAMERA, WORLD_CENTER, type CameraView } from "./room-camera";
import { ChatsPanel, ConnectionsPanel, ProfilePanel, AppearancePanel, NotesPanel, FocusPanel } from "./workspace-panels";
import { WorkspaceNavigationProvider } from "./workspace-navigation";
import { WindowStyleProvider, WindowStyleTool } from "./window-style-context";
import { DEFAULT_WINDOW_STYLE, STYLE_STORAGE_KEY, normalizeWindowStyle, type WindowStyle } from "./window-style";
import type { Id } from "../../../convex/_generated/dataModel";
import { INITIAL_ITEMS, STORAGE, parseRoom, type RoomItem, type LightPreset } from "./room-model";

const components = { chats: ChatsPanel, connections: ConnectionsPanel, profile: ProfilePanel, appearance: AppearancePanel, notes: NotesPanel, focus: FocusPanel, style: WindowStyleTool };
type PanelName = keyof typeof components;
const PANELS: Record<PanelName, {title:string; width:number;height:number;left?:number;right?:number;top?:number;bottom?:number}> = {
  chats: { title: "Chats", width: 390, height: 490, left: 16, top: 82 },
  connections: { title: "Connections", width: 380, height: 475, right: 18, top: 82 },
  style: { title: "Window style", width: 340, height: 440, right: 25, top: 135 },
  profile: { title: "Profile & privacy", width: 540, height: 560, right: 28, top: 100 },
  appearance: { title: "Appearance", width: 520, height: 550, right: 32, top: 105 },
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

function requestedPanel(): PanelName | null {
  if (typeof window === "undefined") return null;
  const name = new URLSearchParams(window.location.search).get("panel");
  return name && Object.hasOwn(PANELS, name) ? name as PanelName : null;
}

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

type AccountStyle = {
  identity: string | null | undefined;
  saved?: WindowStyle | null;
  onSave?: (value: WindowStyle) => Promise<unknown>;
};

// The public lab must still render when Clerk/Convex environment variables
// are absent. Only a backend-configured child may call Convex hooks.
export function CottageWorkspace() {
  const configured = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  return configured ? <ConnectedCottageWorkspace /> : <CottageWorkspaceContent account={{ identity: null }}/>;
}

function ConnectedCottageWorkspace() {
  const profile = useQuery(api.profiles.getMine);
  const save = useMutation(api.profiles.updateWindowStyle);
  return <CottageWorkspaceContent account={{
    identity: profile === undefined ? undefined : profile?._id ?? null,
    saved: profile?.windowStyle ?? null,
    ...(profile ? { onSave: (style: WindowStyle) => save(style) } : {}),
  }} />;
}

function CottageWorkspaceContent({ account }: { account: AccountStyle }) {
  const t = useTranslations("CozyShell");
  const [items, setItems] = useState<RoomItem[]>(INITIAL_ITEMS);
  const [editMode, setEditMode] = useState(false);
  const [light, setLight] = useState<LightPreset>("day");
  const [styleRecord, setStyleRecord] = useState<{ identity: string; value: WindowStyle } | null>(null);
  const [styleSaveStatus, setStyleSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [windowStylePreview, setWindowStylePreview] = useState<WindowStyle | null>(null);
  const styleIdentity = account.identity === undefined ? "loading" : account.identity ?? "guest";
  const windowStyle = styleRecord?.identity === styleIdentity ? styleRecord.value : DEFAULT_WINDOW_STYLE;
  const setWindowStyle = (value: WindowStyle) => {
    if (styleIdentity === "loading") return;
    setStyleRecord({ identity: styleIdentity, value: normalizeWindowStyle(value) });
    setStyleSaveStatus("idle");
  };
  async function saveToAccount() {
    if (!account.onSave || styleIdentity === "loading" || styleSaveStatus === "saving") return;
    setStyleSaveStatus("saving");
    try {
      await account.onSave(windowStyle);
      setStyleSaveStatus("saved");
    } catch {
      setStyleSaveStatus("error");
    }
  }
  const [cameraView, setCameraView] = useState<CameraView>({ level: 1, ...WORLD_CENTER });
  const roomCamera = useRef<RoomCanvasHandle>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const desktop = useSyncExternalStore(subscribeDesktop, desktopSnapshot, () => false);
  const [mobilePanels, setMobilePanels] = useState<MobilePanelName[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Id<"conversations"> | null>(null);
  const [activePanel, setActivePanel] = useState<PanelName | null>(null);
  const dockApi = useRef<DockviewApi | null>(null);
  const pendingPanels = useRef<PanelName[]>([]);
  const subscriptions = useRef<{ dispose(): void } | null>(null);
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [layoutMessage, setLayoutMessage] = useState("Move the furniture, or rearrange the windows.");

  useEffect(() => {
    queueMicrotask(() => {
      try { setItems(parseRoom(localStorage.getItem(STORAGE.furniture))); } catch { /* use defaults */ }
    });
  }, []);

  // One-time hydration for each signed-in account. The server's saved style
  // wins over per-device drafts, while guest settings remain device-local.
  useEffect(() => {
    if (account.identity === undefined) return;
    const key = account.identity ?? "guest";
    let initial = account.saved ? normalizeWindowStyle(account.saved) : DEFAULT_WINDOW_STYLE;
    try {
      const stored = localStorage.getItem(`${STYLE_STORAGE_KEY}:${key}`)
        ?? (key === "guest" ? localStorage.getItem(STYLE_STORAGE_KEY) : null);
      if (!account.saved && stored) initial = normalizeWindowStyle(JSON.parse(stored));
    } catch { /* keep default */ }
    queueMicrotask(() => setStyleRecord(old => old?.identity === key ? old : { identity: key, value: initial }));
  }, [account.identity, account.saved]);

  useEffect(() => {
    if (!styleRecord || styleRecord.identity !== styleIdentity || styleIdentity === "loading") return;
    try { localStorage.setItem(`${STYLE_STORAGE_KEY}:${styleIdentity}`, JSON.stringify(styleRecord.value)); }
    catch { /* session-only fallback */ }
  }, [styleRecord, styleIdentity]);

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
    const requested = requestedPanel();
    if (requested) {
      setActivePanel(requested);
      const existing = api.getPanel(requested);
      if (existing) existing.api.setActive();
      else addFloating(api, requested);
    }
    for (const name of pendingPanels.current.splice(0)) {
      const existing = api.getPanel(name);
      if (existing) existing.api.setActive();
      else addFloating(api, name);
    }
    subscriptions.current?.dispose();
    subscriptions.current = api.onDidLayoutChange(() => {
      if (persistTimer.current) clearTimeout(persistTimer.current);
      persistTimer.current = setTimeout(saveLayout, 300);
    });
  }, [saveLayout]);

  useEffect(() => {
    const requested = requestedPanel();
    if (requested) queueMicrotask(() => setActivePanel(requested));
    // The deep link is a hint only: DirectThread still enforces Convex membership.
    const params = new URLSearchParams(window.location.search);
    const candidate = params.get("conversation");
    if (params.get("panel") === "chats" && validConversationId(candidate)) {
      queueMicrotask(() => setSelectedConversation(candidate as Id<"conversations">));
    }
  }, []);

  useEffect(() => {
    if (desktop) return;
    const requested = requestedPanel();
    if (requested) queueMicrotask(() =>
      setMobilePanels(current => current.includes(requested) ? current : [...current, requested]));
  }, [desktop]);

  function showPanel(name: PanelName) {
    setActivePanel(name);
    if (!desktop) { activateMobile(name); return; }
    const api = dockApi.current;
    if (!api) { pendingPanels.current.push(name); return; }
    const existing = api.getPanel(name);
    if (existing) existing.api.setActive();
    else addFloating(api, name);
  }
  function openConversation(conversationId: Id<"conversations">) {
    setSelectedConversation(conversationId);
    showPanel("chats");
  }
  function activateMobile(name: MobilePanelName) {
    setMobilePanels(current => current[current.length - 1] === name
      ? current : [...current.filter(panel => panel !== name), name]);
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

  return <WorkspaceNavigationProvider value={{ selectedConversation, openConversation, returnToConversations: () => setSelectedConversation(null) }}>
    <WindowStyleProvider value={windowStyle} onChange={setWindowStyle} onPreview={setWindowStylePreview}
      canSaveAccount={Boolean(account.onSave)} onSaveAccount={saveToAccount} saveStatus={styleSaveStatus}>
    <main data-window-material={(windowStylePreview ?? windowStyle).material} data-window-atmosphere={(windowStylePreview ?? windowStyle).atmosphere}
      style={{ "--window-opacity": `${(windowStylePreview ?? windowStyle).opacity}%`, "--window-blur": `${(windowStylePreview ?? windowStyle).blur}px` } as CSSProperties}
      className="cottage-lab flex h-dvh min-h-0 flex-col overflow-hidden bg-[#e7f0e8] text-[#263d36]">
    <header className="cottage-toolbar absolute inset-x-0 top-0 z-30 flex min-h-[60px] items-center justify-between gap-2 border-b border-[#bfd1bd] px-3 py-2 sm:px-5">
      <Link href="/" className="flex min-w-0 items-center gap-2 rounded-xl focus-visible:outline-2 focus-visible:outline-[#407960]" aria-label={t("home")}>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#cfe6ce]"><Home className="size-5"/></span>
        <span className="min-w-0">
          <strong className="block truncate text-sm tracking-tight">Sengapp</strong>
          <span className="hidden text-[11px] text-[#657e70] sm:block">{t("yourSpace")}</span>
        </span>
      </Link>
      <nav aria-label={t("conversations")} className="flex items-center gap-1.5">
        <button type="button" className="cottage-tool" aria-label="Chats" onClick={() => showPanel("chats")}>
          <MessageCircle className="size-4" aria-hidden="true"/><span className="hidden sm:inline">{t("chats")}</span>
        </button>
        <button type="button" className="cottage-tool" aria-label="Connections" onClick={() => showPanel("connections")}>
          <UsersRound className="size-4" aria-hidden="true"/><span className="hidden sm:inline">{t("people")}</span>
        </button>
        <WorkspaceAuthEntry />
      </nav>
    </header>

    <section className="cottage-stage relative h-full min-h-0 w-full flex-1 overflow-hidden">
      <div className="cottage-stage-background absolute inset-0" aria-hidden="true"/>
      <div className="cottage-stage-center absolute inset-0">
        <RoomCanvas ref={roomCamera} items={items} editing={editMode} light={light}
          onChange={changedItems} onHover={changedHover} onViewChange={setCameraView}/>
      </div>
      <nav aria-label="Room camera" className="cottage-camera-controls absolute left-1/2 top-[68px] z-20 flex -translate-x-1/2 items-center gap-1 rounded-2xl border border-[#bbd0c1] bg-[#fffcf2eb] p-1 shadow-sm backdrop-blur-sm">
        <button type="button" aria-label="Zoom out" title="Zoom out" className="cottage-camera-button" disabled={cameraView.level <= CAMERA.minLevel + .001}
          onClick={() => roomCamera.current?.zoomOut()}><ZoomOut className="size-[17px]"/></button>
        <output data-testid="room-zoom-indicator" data-camera-x={cameraView.x.toFixed(2)}
          data-camera-y={cameraView.y.toFixed(2)}
          className="min-w-12 text-center text-xs font-bold tabular-nums" aria-label="Room zoom">
          {cameraView.level.toFixed(1)}×
        </output>
        <button type="button" aria-label="Zoom in" title="Zoom in" className="cottage-camera-button" disabled={cameraView.level >= CAMERA.maxLevel - .001}
          onClick={() => roomCamera.current?.zoomIn()}><ZoomIn className="size-[17px]"/></button>
        <span className="mx-1 h-5 w-px bg-[#c4d7c7]" aria-hidden="true"/>
        <button type="button" aria-label="Fit room" title="Focus on the cottage" className="cottage-camera-button"
          onClick={() => roomCamera.current?.fit()}><Scan className="size-[17px]"/></button>
        <button type="button" aria-label="Fit world" title="Show the 16:10 world" className="cottage-camera-button"
          onClick={() => roomCamera.current?.fitWorld()}><Maximize2 className="size-[17px]"/></button>
      </nav>
      <aside className="pointer-events-none absolute bottom-4 left-4 z-20 max-w-[70%] rounded-2xl border border-[#c3d2c2] bg-[#fffaf0ed] px-4 py-2 text-xs shadow-sm">
        <span className="block font-bold">{hovered ?? (editMode ? "Edit mode · drag sprites to new tiles" : "Your cozy space")}</span>
        <span className="block text-[#63796e]">{editMode ? "Drag furniture to rearrange · Turn off Edit room to pan" : "16:10 world · Drag to pan · Scroll or pinch to zoom"}</span>
      </aside>
      <details className="cottage-utilities absolute bottom-4 right-4 z-50" data-testid="workspace-utilities">
        <summary className="cottage-utilities-trigger" aria-label={t("tools")} title={t("tools")}>
          <Settings className="size-5" aria-hidden="true" />
          <span className="sr-only">{t("tools")}</span>
        </summary>
        <div className="cottage-utilities-menu" aria-label={t("tools")}>
          <p className="cottage-utilities-heading">{t("personal")}</p>
          <button type="button" onClick={event => { showPanel("profile"); event.currentTarget.closest("details")?.removeAttribute("open"); }}>
            <Settings2 aria-hidden="true" className="size-4" />{t("profile")}
          </button>
          <button type="button" onClick={event => { showPanel("appearance"); event.currentTarget.closest("details")?.removeAttribute("open"); }}>
            <Palette aria-hidden="true" className="size-4" />{t("appearance")}
          </button>
          <button type="button" onClick={event => { showPanel("style"); event.currentTarget.closest("details")?.removeAttribute("open"); }}>
            <SlidersHorizontal aria-hidden="true" className="size-4" />{t("windowStyle")}
          </button>
          <p className="cottage-utilities-heading">{t("roomAndTools")}</p>
          <button type="button" onClick={event => { showPanel("notes"); event.currentTarget.closest("details")?.removeAttribute("open"); }}>
            <BookOpenText aria-hidden="true" className="size-4" />{t("notes")}
          </button>
          <button type="button" onClick={event => { showPanel("focus"); event.currentTarget.closest("details")?.removeAttribute("open"); }}>
            <Timer aria-hidden="true" className="size-4" />{t("focus")}
          </button>
          <button type="button" aria-pressed={editMode} onClick={() => setEditMode(value => !value)}>
            {editMode ? <Check aria-hidden="true" className="size-4" /> : <Armchair aria-hidden="true" className="size-4" />}{editMode ? t("done") : t("editRoom")}
          </button>
          <button type="button" onClick={() => setLight(value => value === "day" ? "evening" : "day")}>
            {light === "day" ? <CloudMoon aria-hidden="true" className="size-4" /> : <Sun aria-hidden="true" className="size-4" />}
            {light === "day" ? t("evening") : t("day")}
          </button>
          <p className="cottage-utilities-heading">{t("reset")}</p>
          <button type="button" onClick={resetFurniture}><RotateCcw aria-hidden="true" className="size-4" />{t("resetRoom")}</button>
          {desktop && <button type="button" onClick={resetWindows}><LayoutPanelLeft aria-hidden="true" className="size-4" />{t("resetWindows")}</button>}
          <ExperienceSwitch to="classic" panel={activePanel} conversationId={activePanel === "chats" ? selectedConversation : null} className="cottage-utilities-fallback" />
          <Link className="cottage-utilities-fallback" href="/chats">{t("simpleChat")}</Link>
        </div>
      </details>
      {desktop && <div className="cottage-dock-layer absolute inset-0 z-10" aria-label="Floating workspace windows">
        <DockviewReact className="cottage-dock" theme={themeLight} components={components}
          floatingGroupDragHandle="titlebar" onReady={onDockReady}/>
      </div>}
      {!desktop && <MobileWindowLayer openPanels={mobilePanels} onActivate={activateMobile} onClose={closeMobile}/>} 
      <span className="sr-only" role="status">{layoutMessage}</span>
    </section>
  </main></WindowStyleProvider></WorkspaceNavigationProvider>;
}
