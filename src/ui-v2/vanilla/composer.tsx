"use client";

import { useRef, type FormEvent, type KeyboardEvent } from "react";
import { ArrowUpIcon, BotIcon, PaperclipIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupTextarea } from "@/components/ui/input-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { companion } from "./data";

export function VanillaComposer({
  text, onTextChange, onSend,
}: {
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
    onTextChange(text + divider + "@" + companion.handle + " ");
  }
  return (
    <form ref={formRef} onSubmit={submit} aria-label="Demo message composer" className="w-full">
      <InputGroup className="bg-muted/50">
        <InputGroupTextarea
          value={text}
          onChange={event => onTextChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write a message… or mention @Milo"
          aria-label="Write a message"
          rows={2}
          className="min-h-14"
        />
        <InputGroupAddon align="block-end" className="pt-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <InputGroupButton type="button" variant="outline" size="icon-sm" aria-label="Add attachment">
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
              <InputGroupButton type="button" variant="outline" size="icon-sm" aria-label="Mention a companion">
                <BotIcon />
              </InputGroupButton>
            </PopoverTrigger>
            <PopoverContent align="start" side="top" className="space-y-3">
              <p className="text-sm font-medium">Companions in this conversation</p>
              <p className="text-xs text-muted-foreground">
                This is UI-only. Group and peer consent must be verified by the server before any AI receives messages.
              </p>
              <Button type="button" variant="secondary" className="w-full justify-start" onClick={mentionAgent}>
                <BotIcon className="size-4" /> Mention @{companion.handle} (preview)
              </Button>
            </PopoverContent>
          </Popover>
          <InputGroupButton
            type="submit" variant="default" size="icon-sm" className="ml-auto rounded-full"
            aria-label="Send" disabled={!text.trim()}
          >
            <ArrowUpIcon />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </form>
  );
}
