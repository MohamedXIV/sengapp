"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageCircle, StickyNote, Timer, Play, Pause, RotateCcw, ArrowUpRight } from "lucide-react";
import { STORAGE } from "./room-model";

export function ChatsPanel() {
  return <section className="cottage-panel-body space-y-3">
    <div className="flex items-center gap-2 text-[#557963]"><MessageCircle className="size-5" /><strong>Private conversations</strong></div>
    <p>Your real DMs and private groups are one click away. This lab doesn&apos;t read or imitate your messages.</p>
    <Link className="cottage-link" href="/chats">Open Sengapp messages <ArrowUpRight className="size-4" /></Link>
    <p className="text-xs opacity-70">Later: embed the actual authorized chat surface in this panel.</p>
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
