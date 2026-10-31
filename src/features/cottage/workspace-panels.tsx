"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { StickyNote, Timer, Play, Pause, RotateCcw, ArrowUpRight } from "lucide-react";
import { MemberGate } from "@/components/access/member-gate";
import { ConversationsList } from "@/features/chats/conversations-list";
import { DirectThread } from "@/features/chats/direct-thread";
import type { Id } from "../../../convex/_generated/dataModel";
import { STORAGE } from "./room-model";

export function ChatsPanel() {
  const [selected, setSelected] = useState<Id<"conversations"> | null>(null);
  const t = useTranslations("Chats");

  return <section data-testid="cottage-live-chats" className="flex h-full min-h-0 flex-col gap-2 overflow-hidden bg-card text-card-foreground">
    <div className="flex shrink-0 items-center justify-between gap-2 px-3 pt-3">
      <h2 className="text-sm font-semibold">{t("title")}</h2>
      <Link href="/chats" className="flex min-h-9 items-center gap-1 rounded-xl px-2 text-xs text-primary underline-offset-2 hover:underline">
        {t("title")} <ArrowUpRight className="size-3.5" aria-hidden="true" />
      </Link>
    </div>
    <div className="min-h-0 flex-1 overflow-hidden px-2 pb-2">
      <MemberGate embedded>{profile => selected
        ? <DirectThread key={selected} embedded conversationId={selected}
            meProfileId={profile._id} onBack={() => setSelected(null)}/>
        : <ConversationsList compact onSelect={setSelected}/>}
      </MemberGate>
    </div>
  </section>;
}

export function NotesPanel() {
  const [note, setNote] = useState("");
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    queueMicrotask(() => {
      try { setNote(localStorage.getItem(STORAGE.notes) ?? "Sketch the next cozy room ✨"); } catch { /* storage can be blocked */ }
      setLoaded(true);
    });
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(STORAGE.notes, note); } catch { /* keep notes usable in memory */ }
  }, [note, loaded]);
  return <section className="cottage-panel-body flex h-full flex-col gap-2">
    <label className="flex items-center gap-2 font-semibold text-[#496758]" htmlFor="cottage-note">
      <StickyNote className="size-5" /> A little note to yourself
    </label>
    <textarea id="cottage-note" className="cottage-note min-h-24 w-full flex-1 resize-none"
      placeholder="Write something small..." value={note} onChange={event => setNote(event.target.value)}
      maxLength={6000}/>
    <p className="text-xs opacity-70">Private to this browser · {note.length}/6000</p>
  </section>;
}

const FOCUS_SECONDS = 25 * 60;
export function FocusPanel() {
  const [remaining, setRemaining] = useState(FOCUS_SECONDS);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running) return;
    const interval = window.setInterval(() => setRemaining(value => {
      if (value <= 1) { setRunning(false); return 0; }
      return value - 1;
    }), 1000);
    return () => clearInterval(interval);
  }, [running]);
  const clock = `${Math.floor(remaining / 60).toString().padStart(2, "0")}:${(remaining % 60).toString().padStart(2, "0")}`;
  return <section className="cottage-panel-body flex flex-col items-center gap-3 text-center">
    <span className="flex items-center gap-2 text-sm font-semibold"><Timer className="size-4" /> Your focus moment</span>
    <strong className="text-4xl font-semibold tabular-nums tracking-widest" aria-live="off">{clock}</strong>
    <div className="flex gap-2">
      <button className="cottage-mini-button" onClick={() => { if (remaining === 0) setRemaining(FOCUS_SECONDS); setRunning(value => !value); }}>
        {running ? <Pause className="size-4"/> : <Play className="size-4"/>}{running ? "Pause" : "Start"}
      </button>
      <button className="cottage-mini-button" onClick={() => {setRunning(false);setRemaining(FOCUS_SECONDS);}}>
        <RotateCcw className="size-4"/> Reset
      </button>
    </div>
    <p className="text-xs opacity-70">A simple 25-minute timer. It runs only while this panel is open.</p>
  </section>;
}
