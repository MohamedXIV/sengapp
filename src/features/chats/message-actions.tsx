"use client";

import * as Menu from "@radix-ui/react-dropdown-menu";
import { MoreHorizontal, MessageSquareReply, Pencil, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { Id } from "../../../convex/_generated/dataModel";

const REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🎉"] as const;

type Reaction = { profileId: Id<"profiles">; emoji: string };

export function MessageActions({
  own, meProfileId, reactions = [], onReply, onEdit, onDelete, onReact,
}: {
  own: boolean;
  meProfileId: Id<"profiles">;
  reactions?: Reaction[];
  onReply: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onReact: (emoji: string) => void;
}) {
  const t = useTranslations("Chats");
  const counts = REACTIONS.map(emoji => ({
    emoji, count: reactions.filter(reaction => reaction.emoji === emoji).length,
    mine: reactions.some(reaction => reaction.emoji === emoji && reaction.profileId === meProfileId),
  })).filter(item => item.count > 0);

  return <div className="flex min-w-0 flex-wrap items-center gap-1">
    <Menu.Root>
      <Menu.Trigger asChild>
        <Button type="button" size="icon" variant="ghost" className="size-8 shrink-0 rounded-full text-muted-foreground"
          aria-label={t("messageActions")}>
          <MoreHorizontal className="size-4" aria-hidden="true" />
        </Button>
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Content sideOffset={5} align={own ? "end" : "start"}
          className="z-[100] min-w-44 rounded-xl border bg-popover p-1 text-popover-foreground shadow-lg outline-none">
          <Menu.Item onSelect={onReply}
            className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm outline-none focus:bg-accent">
            <MessageSquareReply className="size-4" aria-hidden="true" />{t("reply")}
          </Menu.Item>
          {own && onEdit && <Menu.Item onSelect={onEdit}
            className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm outline-none focus:bg-accent">
            <Pencil className="size-4" aria-hidden="true" />{t("editMessage")}
          </Menu.Item>}
          {own && onDelete && <Menu.Item onSelect={onDelete}
            className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive outline-none focus:bg-destructive/10">
            <Trash2 className="size-4" aria-hidden="true" />{t("deleteMessage")}
          </Menu.Item>}
          <Menu.Separator className="my-1 h-px bg-border" />
          <div role="group" aria-label={t("reactions")} className="flex items-center gap-1 p-1">
            {REACTIONS.map(emoji => <button type="button" key={emoji}
              aria-label={t("reactWith", { emoji })}
              onClick={() => onReact(emoji)}
              className="rounded-md p-1 text-lg hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">
              {emoji}
            </button>)}
          </div>
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
    {counts.map(({ emoji, count, mine }) => <button key={emoji} type="button"
      onClick={() => onReact(emoji)} aria-label={t("reactionCount", { emoji, count })}
      aria-pressed={mine}
      className={`rounded-full border px-2 py-0.5 text-xs transition-colors hover:bg-accent ${mine ? "border-primary/50 bg-primary/10" : "border-border bg-card"}`}>
      {emoji} <span className="tabular-nums">{count}</span>
    </button>)}
  </div>;
}
