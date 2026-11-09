"use client";

import { createContext, useContext, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { useLocale } from "next-intl";
import type { AppLocale } from "@/lib/i18n/locale";
import {
  conversations, exampleAgentConsent, sampleCompanionActivity, sampleMessages,
  type MessageData, type PreviewCompanion,
} from "../vanilla/data";
import { THEME_PRESETS, isHex, isPalette, type PaletteMode, type ColorRole, type PalettePair } from "./theme-utils";
import type { PreviewDecision } from "../vanilla/agent-activity";

export type ShellMode = "classic" | "cozy";
export type WorkspaceView = "Chats" | "People" | "Notes" | "Settings";
export type ConversationFilter = "All chats" | "Unread" | "Groups";
export type Corners = "soft" | "balanced" | "round";
export type Shadow = "none" | "soft" | "deep";
export type RightPanelSection = "appearance" | "companion";
export type Appearance = { locale: AppLocale; palettes: PalettePair; corners: Corners; shadow: Shadow };
export const DEFAULT_APPEARANCE: Appearance = {
  locale: "en", palettes: THEME_PRESETS[0].palettes, corners: "balanced", shadow: "soft",
};
const APPEARANCE_STORAGE = "sengapp-ui-v2-appearance-v2";
const LEGACY_STORAGE = "sengapp-ui-v2-appearance-v1";
const APPEARANCE_EVENT = "sengapp-ui-v2-appearance-update";

function snapshot(): string {
  try { return window.localStorage.getItem(APPEARANCE_STORAGE) ?? window.localStorage.getItem(LEGACY_STORAGE) ?? ""; }
  catch { return ""; }
}
function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(APPEARANCE_EVENT, onChange);
  return () => { window.removeEventListener("storage", onChange); window.removeEventListener(APPEARANCE_EVENT, onChange); };
}
const serverSnapshot = () => "";

function parseAppearance(raw: string, defaultLocale: AppLocale): Appearance {
  const defaultValue: Appearance = { ...DEFAULT_APPEARANCE, locale: defaultLocale };
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return defaultValue;
    const data = value as Record<string, unknown>;
    const corners = ["soft","balanced","round"].includes(String(data.corners)) ? data.corners as Corners : defaultValue.corners;
    const shadow = ["none","soft","deep"].includes(String(data.shadow)) ? data.shadow as Shadow : defaultValue.shadow;
    const locale = data.locale === "en" || data.locale === "ar" ? data.locale : defaultLocale;
    const palettes = data.palettes as Record<string, unknown> | undefined;
    if (palettes && isPalette(palettes.light) && isPalette(palettes.dark)) {
      return { corners, shadow, locale, palettes: { light: palettes.light, dark: palettes.dark } };
    }
    // Migrate the previous fixed-accent preview without discarding corners/shadows.
    const names: Record<string,number> = { sage:0,rose:2,lavender:1,honey:2 };
    const idx = names[String(data.accent)] ?? 0;
    return { corners, shadow, locale, palettes: THEME_PRESETS[idx].palettes };
  } catch { return defaultValue; }
}

export type Workspace = {
  shell: ShellMode;
  setShell: (mode: ShellMode) => void;
  appearance: Appearance;
  updateAppearance: (update: Partial<Appearance>) => void;
  updatePalette: (mode: PaletteMode, role: ColorRole, hex: string) => void;
  applyPreset: (index: number) => void;
  rightPanelOpen: boolean;
  setRightPanelOpen: (open: boolean) => void;
  rightPanelSection: RightPanelSection;
  openRightPanel: (section: RightPanelSection) => void;
  view: WorkspaceView;
  filter: ConversationFilter;
  selectedId: string;
  conversation: (typeof conversations)[number] | undefined;
  title: string;
  subtitle: string;
  messages: MessageData[];
  draft: string;
  setDraft: (text: string) => void;
  companion: PreviewCompanion | null;
  saveCompanion: (name: string, handle: string) => void;
  decisions: Record<string, PreviewDecision>;
  decide: (key: string, decision: PreviewDecision) => void;
  select: (id: string) => void;
  navigate: (name: string) => void;
  send: () => void;
};
const WorkspaceContext = createContext<Workspace | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const rootLocale = useLocale() === "ar" ? "ar" : "en";
  const [shell, setShell] = useState<ShellMode>("classic");
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [rightPanelSection, setRightPanelSection] = useState<RightPanelSection>("appearance");
  function openRightPanel(section: RightPanelSection) { setRightPanelSection(section); setRightPanelOpen(true); }
  const persisted = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const storedAppearance = useMemo(() => parseAppearance(persisted, rootLocale), [persisted, rootLocale]);
  const [fallback, setFallback] = useState<Appearance | null>(null);
  const appearance = fallback ?? storedAppearance;
  const [view, setView] = useState<WorkspaceView>("Chats");
  const [filter, setFilter] = useState<ConversationFilter>("All chats");
  const [selectedId, setSelectedId] = useState("team");
  const [draft, setDraft] = useState("");
  const [companion, setCompanion] = useState<PreviewCompanion | null>(null);
  const [threads, setThreads] = useState<Record<string, MessageData[]>>(sampleMessages);
  const [decisions, setDecisions] = useState<Record<string, PreviewDecision>>({});

  function updateAppearance(update: Partial<Appearance>) {
    const next = { ...appearance, ...update };
    try {
      window.localStorage.setItem(APPEARANCE_STORAGE, JSON.stringify(next));
      window.dispatchEvent(new Event(APPEARANCE_EVENT));
      setFallback(null);
    } catch { setFallback(next); }
  }
  function updatePalette(mode: PaletteMode, role: ColorRole, hex: string) {
    if (!isHex(hex)) return;
    updateAppearance({palettes: {...appearance.palettes,[mode]: {...appearance.palettes[mode],[role]: hex.toUpperCase()}}});
  }
  function applyPreset(index: number) {
    const preset = THEME_PRESETS[index];
    if (preset) updateAppearance({palettes: preset.palettes});
  }
  function saveCompanion(nameInput: string, handleInput: string) {
    const name = nameInput.trim(), handle = handleInput.trim().toLowerCase();
    if (!name || name.length > 40 || !/^[a-z][a-z0-9_]{1,23}$/.test(handle)) return;
    setCompanion({ name, handle });
    setThreads(previous => {
      const next = Object.fromEntries(Object.entries(previous).map(([id, rows]) => [
        id, rows.map(row => row.kind === "agent" ? { ...row, sender: name } : row),
      ])) as Record<string, MessageData[]>;
      if (!(next.team ?? []).some(row => row.id === sampleCompanionActivity.id)) {
        next.team = [...(next.team ?? []), { ...sampleCompanionActivity, sender: name }];
      }
      return next;
    });
  }
  function select(id: string) { setSelectedId(id); setDraft(""); setView("Chats"); }
  function navigate(name: string) {
    if (name === "All chats" || name === "Unread" || name === "Groups") {
      setFilter(name); setView("Chats");
    } else if (["Chats", "People", "Notes", "Settings"].includes(name)) setView(name as WorkspaceView);
  }
  // Mock-only: no agent provider, connected tools or server membership data.
  function send() {
    const text = draft.trim(); if (!text) return;
    const id = "local-" + Date.now() + "-" + Math.random().toString(36).slice(2);
    const additions: MessageData[] = [{ id, sender: "You", time: "Now", text, mine: true }];
    const mentioned = companion !== null && new RegExp("(?:^|\\s)@" + companion.handle + "(?=$|\\s|[,.!?])", "i").test(text);
    if (mentioned && companion && exampleAgentConsent[selectedId]) additions.push({
      id:id+"-companion",sender:companion.name,kind:"agent",time:"Now",
      text:"Local UI example: I can be addressed in this thread. No AI model, memory, connected app or tool has been called.",
      parts:[{type:"tool",title:"Awaiting a permissioned AI backend",status:"pending"}],
    });
    else if (mentioned) additions.push({
      id:id+"-permission",sender:"System",kind:"notice",time:"Now",
      text:"Companion request not activated. Every participant must explicitly consent before an agent can receive context here. Nothing was sent to a provider.",
    });
    setThreads(previous => ({...previous,[selectedId]:[...(previous[selectedId]??[]),...additions]}));setDraft("");
  }
  const conversation = conversations.find(item => item.id === selectedId);
  const value:Workspace = {
    shell,setShell,appearance,updateAppearance,updatePalette,applyPreset,
    rightPanelOpen,setRightPanelOpen,rightPanelSection,openRightPanel,
    view,filter,selectedId,conversation,
    title:selectedId==="new"?"New conversation":conversation?.name??"Dev Team",
    subtitle:selectedId==="new"?"A fresh conversation, just for this preview":conversation?.people??"",
    messages:threads[selectedId]??[],draft,setDraft,companion,saveCompanion,decisions,
    decide:(key,decision)=>setDecisions(previous=>({...previous,[key]:decision})),select,navigate,send,
  };
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}
export function useWorkspace(): Workspace {
  const value = useContext(WorkspaceContext);
  if(!value) throw new Error("useWorkspace requires WorkspaceProvider");
  return value;
}
