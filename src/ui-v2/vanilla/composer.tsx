"use client";

import { useRef, type FormEvent, type KeyboardEvent } from "react";
import { ArrowUpIcon, BotIcon, PaperclipIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupTextarea } from "@/components/ui/input-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { PreviewCompanion } from "./data";

export function VanillaComposer({
  text, onTextChange, onSend, companion,
}: {
  companion: PreviewCompanion | null;
  text: string;
  onTextChange: (value: string) => void;
  onSend: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); onSend(); }
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    if (window.matchMedia?.("(pointer: coarse)").matches) return;
    event.preventDefault();
    formRef.current?.requestSubmit();
  }
  function mentionAgent() {
    const divider = text && !/\s$/.test(text) ? " " : "";
    if (companion) onTextChange(text + divider + "@" + companion.handle + " ");
  }
  return (
    <form ref={formRef} onSubmit={submit} aria-label="Demo message composer" className="mx-auto w-full max-w-[860px]">
      <InputGroup className="overflow-hidden rounded-2xl border bg-card shadow-[0_12px_30px_-12px_rgba(28,54,43,0.26)]">
        <InputGroupTextarea
          value={text}
          onChange={event => onTextChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={companion ? `Write a message… or mention @${companion.handle}` : "Write a message…"}
          aria-label="Write a message"
          rows={1}
          className="max-h-32 min-h-10 px-4 pb-1 pt-3 text-[15px] leading-relaxed"
        />
        <InputGroupAddon align="block-end" className="gap-1 px-2 pb-2 pt-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <InputGroupButton type="button" variant="ghost" size="icon-sm" className="rounded-full" aria-label="Add attachment">
                <PlusIcon />
              </InputGroupButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="top">
              <DropdownMenuItem disabled>
                <PaperclipIcon /> Photos and files (later)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Popover>
            <PopoverTrigger asChild>
              <InputGroupButton type="button" variant="ghost" size="icon-sm" className="rounded-full" aria-label="Mention a companion">
                <BotIcon />
              </InputGroupButton>
            </PopoverTrigger>
            <PopoverContent align="start" side="top" className="space-y-3">
              <p className="text-sm font-medium">Companions in this conversation</p>
              <p className="text-xs text-muted-foreground">
                This is UI-only. Group and peer consent must be verified by the server before any AI receives messages.
              </p>
              {companion ? (
                <Button type="button" variant="secondary" className="w-full justify-start" onClick={mentionAgent}>
                  <BotIcon className="size-4" /> Mention @{companion.handle} (preview)
                </Button>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Open Preferences, then Companion, to choose a name and mention alias.
                </p>
              )}
            </PopoverContent>
          </Popover>
          <InputGroupButton
            type="submit" variant="default" size="icon-sm" className="ml-auto size-9 rounded-full"
            aria-label="Send" disabled={!text.trim()}
          >
            <ArrowUpIcon />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </form>
  );
}
