"use client";

import { useRef, type FormEvent, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("UiV2");
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
    <form ref={formRef} onSubmit={submit} aria-label={t("writeMessage")} className="mx-auto w-full max-w-[860px]">
      <InputGroup className="overflow-hidden rounded-2xl border bg-card shadow-[0_12px_30px_-12px_rgba(28,54,43,0.26)]">
        <InputGroupTextarea
          value={text}
          onChange={event => onTextChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={companion ? t("writeMention",{alias:companion.handle}) : t("writePlaceholder")}
          aria-label={t("writeMessage")}
          rows={1}
          className="max-h-32 min-h-10 px-4 pb-1 pt-3 text-[15px] leading-relaxed"
        />
        <InputGroupAddon align="block-end" className="gap-1 px-2 pb-2 pt-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <InputGroupButton type="button" variant="ghost" size="icon-sm" className="rounded-full" aria-label={t("attachment")}>
                <PlusIcon />
              </InputGroupButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="top">
              <DropdownMenuItem disabled>
                <PaperclipIcon /> {t("filesLater")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Popover>
            <PopoverTrigger asChild>
              <InputGroupButton type="button" variant="ghost" size="icon-sm" className="rounded-full" aria-label={t("mentionCompanion")}>
                <BotIcon />
              </InputGroupButton>
            </PopoverTrigger>
            <PopoverContent align="start" side="top" className="space-y-3">
              <p className="text-sm font-medium">{t("companionInConversation")}</p>
              <p className="text-xs text-muted-foreground">
                {t("consentWarning")}
              </p>
              {companion ? (
                <Button type="button" variant="secondary" className="w-full justify-start" onClick={mentionAgent}>
                  <BotIcon className="size-4" /> {t("mentionPreview",{alias:companion.handle})}
                </Button>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {t("chooseCompanion")}
                </p>
              )}
            </PopoverContent>
          </Popover>
          <InputGroupButton
            type="submit" variant="default" size="icon-sm" className="ml-auto size-9 rounded-full"
            aria-label={t("send")} disabled={!text.trim()}
          >
            <ArrowUpIcon />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </form>
  );
}
