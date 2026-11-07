"use client";

import type { FormEvent, KeyboardEvent } from "react";
import { Paperclip, Send, Smile, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupTextarea, InputGroupText } from "@/components/ui/input-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { DemoMessage } from "./studio-data";

const emojis = ["💜", "❤️", "😊", "👏", "🎉", "🌿", "✨", "😂"];
export interface MessageComposerProps {
  recipient: string;
  draft: string;
  reply: DemoMessage | null;
  editing: DemoMessage | null;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  onCancel: () => void;
  onAttach: () => void;
}
export function MessageComposer({ recipient, draft, reply, editing, onDraftChange, onSend, onCancel, onAttach }: MessageComposerProps) {
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); onSend(); }
  function keyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    // On touch screens Enter adds a line; tapping Send is explicit.
    if (typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches) return;
    event.preventDefault(); onSend();
  }
  return <div className="s2-composer-shell border-t border-[var(--s2-line)]">
    <div className="mx-auto max-w-3xl">
      {(reply || editing) && <div className="mb-2 flex items-center justify-between gap-2 rounded-md border-s-[3px] border-[var(--s2-accent)] bg-[var(--s2-panel)] px-3 py-2 text-xs">
        <div className="min-w-0">
          <span className="font-semibold text-[var(--s2-accent)]">{editing ? "Editing your message" : "Replying to " + reply?.sender}</span>
          <span className="block truncate text-[var(--s2-muted)]" dir="auto">{(editing?.text ?? reply?.text ?? "").split("\n")[0]}</span>
        </div>
        <Button type="button" variant="ghost" size="icon" className="size-8 shrink-0" aria-label={editing ? "Cancel edit" : "Cancel reply"} onClick={onCancel}>
          <X className="size-4"/>
        </Button>
      </div>}
      <form onSubmit={submit} aria-label="Demo message composer">
        <InputGroup className="overflow-visible border-[var(--s2-line)] bg-[var(--s2-paper)] shadow-none" style={{ borderRadius: "var(--s2-radius)" }}>
          <label htmlFor="s2-message-draft" className="sr-only">Write a message</label>
          <InputGroupTextarea id="s2-message-draft" rows={2} maxLength={3000}
            placeholder={"Write to " + recipient + "…"} value={draft} onChange={event => onDraftChange(event.target.value)}
            onKeyDown={keyDown} className="min-h-[48px] max-h-36 px-3 py-2.5 text-[13px] leading-relaxed"/>
          <InputGroupAddon align="block-end" className="justify-between px-2 pb-2 pt-0">
            <div className="flex items-center gap-1">
              <Popover>
                <PopoverTrigger asChild>
                  <InputGroupButton size="icon-sm" variant="ghost" className="size-9 sm:size-8" aria-label="Choose emoji">
                    <Smile className="size-4"/>
                  </InputGroupButton>
                </PopoverTrigger>
                <PopoverContent align="start" side="top" sideOffset={8} collisionPadding={12} className="w-auto max-w-[calc(100vw-2rem)] p-2">
                  <div className="grid grid-cols-4 gap-1" aria-label="Quick emoji picker">
                    {emojis.map(emoji => <Button key={emoji} type="button" variant="ghost" size="icon"
                      className="size-10 text-lg" aria-label={"Insert " + emoji}
                      onClick={() => onDraftChange(draft + emoji)}>{emoji}</Button>)}
                  </div>
                </PopoverContent>
              </Popover>
              <InputGroupButton size="icon-sm" variant="ghost" className="size-9 sm:size-8"
                aria-label="Attach file (demo)" onClick={onAttach}><Paperclip className="size-4"/></InputGroupButton>
            </div>
            <div className="flex items-center gap-2">
              <InputGroupText className="hidden text-[10px] sm:inline-flex">Shift+Enter for a new line</InputGroupText>
              <InputGroupButton type="submit" size="icon-sm" variant="default" aria-label="Add message to local demo" disabled={!draft.trim()}
                className="size-9 rounded-full bg-[var(--s2-accent)] text-[var(--s2-accent-ink)] hover:opacity-90"><Send className="size-4"/></InputGroupButton>
            </div>
          </InputGroupAddon>
        </InputGroup>
      </form>
      <p className="pt-1.5 text-center text-[10px] text-[var(--s2-faint)]">Design preview only · Nothing is sent to anyone</p>
    </div>
  </div>;
}
