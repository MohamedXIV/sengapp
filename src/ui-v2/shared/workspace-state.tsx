"use client";

import { createContext, useContext, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import {
  conversations, exampleAgentConsent, sampleCompanionActivity, sampleMessages,
  type MessageData, type PreviewCompanion,
} from "../vanilla/data";
import type { PreviewDecision } from "../vanilla/agent-activity";

export type ShellMode = "classic" | "cozy";
export type WorkspaceView = "Chats" | "People" | "Notes" | "Settings";
export type ConversationFilter = "All chats" | "Unread" | "Groups";
export type Accent = "sage" | "rose" | "lavender" | "honey";
export type Corners = "soft" | "balanced" | "round";
export type Shadow = "none" | "soft" | "deep";
export type RightPanelSection = "appearance" | "companion";
export type Appearance = { accent: Accent; corners: Corners; shadow: Shadow };
export const DEFAULT_APPEARANCE: Appearance = {
  accent: "sage", corners: "balanced", shadow: "soft",
};
const APPEARANCE_STORAGE = "sengapp-ui-v2-appearance-v1";
const APPEARANCE_EVENT = "sengapp-ui-v2-appearance-update";

function appearanceSnapshot(): string {
  try { return window.localStorage.getItem(APPEARANCE_STORAGE) ?? ""; }
  catch { return ""; }
}
function subscribeAppearance(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(APPEARANCE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(APPEARANCE_EVENT, onChange);
  };
}
function defaultAppearanceSnapshot() { return ""; }


export type Workspace = {
  shell: ShellMode;
  setShell: (mode: ShellMode) => void;
  appearance: Appearance;
  updateAppearance: (update: Partial<Appearance>) => void;
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

function isAppearance(value: unknown): value is Appearance {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<Appearance>;
  return ["sage", "rose", "lavender", "honey"].includes(v.accent ?? "")
    && ["soft", "balanced", "round"].includes(v.corners ?? "")
    && ["none", "soft", "deep"].includes(v.shadow ?? "");
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [shell, setShell] = useState<ShellMode>("classic");
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [rightPanelSection, setRightPanelSection] = useState<RightPanelSection>("appearance");
  function openRightPanel(section: RightPanelSection) {
    setRightPanelSection(section);
    setRightPanelOpen(true);
  }
  // SSR-safe: React reads the server snapshot during hydration, then the
  // browser preference. No synchronous setState in effects or flash of errors.
  const persisted = useSyncExternalStore(subscribeAppearance, appearanceSnapshot, defaultAppearanceSnapshot);
  const storedAppearance = useMemo<Appearance>(() => {
    try {
      const value: unknown = JSON.parse(persisted);
      return isAppearance(value) ? value : DEFAULT_APPEARANCE;
    } catch { return DEFAULT_APPEARANCE; }
  }, [persisted]);
  const [memoryFallback, setMemoryFallback] = useState<Appearance | null>(null);
  const appearance = memoryFallback ?? storedAppearance;
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
      setMemoryFallback(null);
    } catch {
      // Browser storage can be disabled; keep the preview fully interactive.
      setMemoryFallback(next);
    }
  }
  function saveCompanion(nameInput: string, handleInput: string) {
    const name = nameInput.trim();
    const handle = handleInput.trim().toLowerCase();
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
  function select(id: string) {
    setSelectedId(id);
    setDraft("");
    setView("Chats");
  }
  function navigate(name: string) {
    if (name === "All chats" || name === "Unread" || name === "Groups") {
      setFilter(name);
      setView("Chats");
    } else if (["Chats", "People", "Notes", "Settings"].includes(name)) {
      setView(name as WorkspaceView);
    }
  }
  // Preview-only. An agent is never contacted and no real consent is inferred.
  function send() {
    const text = draft.trim();
    if (!text) return;
    const id = "local-" + Date.now() + "-" + Math.random().toString(36).slice(2);
    const additions: MessageData[] = [{ id, sender: "You", time: "Now", text, mine: true }];
    const mentioned = companion !== null
      && new RegExp("(?:^|\\s)@" + companion.handle + "(?=$|\\s|[,.!?])", "i").test(text);
    if (mentioned && companion && exampleAgentConsent[selectedId]) {
      additions.push({
        id: id + "-companion", sender: companion.name, kind: "agent", time: "Now",
        text: "Local UI example: I can be addressed in this thread. No AI model, memory, connected app or tool has been called.",
        parts: [{ type: "tool", title: "Awaiting a permissioned AI backend", status: "pending" }],
      });
    } else if (mentioned) {
      additions.push({
        id: id + "-permission", sender: "System", kind: "notice", time: "Now",
        text: "Companion request not activated. Every participant must explicitly consent before an agent can receive context here. Nothing was sent to a provider.",
      });
    }
    setThreads(previous => ({ ...previous, [selectedId]: [...(previous[selectedId] ?? []), ...additions] }));
    setDraft("");
  }

  const conversation = conversations.find(item => item.id === selectedId);
  const value: Workspace = {
    shell, setShell, appearance, updateAppearance, rightPanelOpen, setRightPanelOpen, rightPanelSection, openRightPanel,
    view, filter, selectedId,
    conversation, title: selectedId === "new" ? "New conversation" : conversation?.name ?? "Dev Team",
    subtitle: selectedId === "new" ? "A fresh conversation, just for this preview" : conversation?.people ?? "",
    messages: threads[selectedId] ?? [], draft, setDraft, companion, saveCompanion,
    decisions, decide: (key, decision) => setDecisions(previous => ({ ...previous, [key]: decision })),
    select, navigate, send,
  };
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): Workspace {
  const value = useContext(WorkspaceContext);
  if (!value) throw new Error("useWorkspace requires WorkspaceProvider");
  return value;
}
