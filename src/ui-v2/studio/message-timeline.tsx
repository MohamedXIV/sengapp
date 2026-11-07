"use client";

import type { RefObject } from "react";
import { CheckCheck, Copy, Heart, MoreHorizontal, Pencil, Reply, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Toggle } from "@/components/ui/toggle";
import type { DemoMessage } from "./studio-data";

export interface MessageTimelineProps {
  conversationName: string;
  conversationId: string;
  messages: DemoMessage[];
  reacted: readonly string[];
  endRef: RefObject<HTMLDivElement | null>;
  onReact: (id: string, emoji: string) => void;
  onReply: (message: DemoMessage) => void;
  onEdit: (message: DemoMessage) => void;
  onDelete: (message: DemoMessage) => void;
  onCopy: (message: DemoMessage) => void;
}
const emojis = ["💜", "❤️", "👏", "🚀"];

function MessageRow({ message, conversationId, reacted, onReact, onReply, onEdit, onDelete, onCopy }:
  Omit<MessageTimelineProps, "conversationName" | "messages" | "endRef"> & { message: DemoMessage }) {
  const own = Boolean(message.own);
  return <article className={"group flex items-start gap-2.5 " + (own ? "flex-row-reverse" : "")} data-message-id={message.id}>
    {!own && <Avatar className="mt-1 size-8 shrink-0" aria-hidden="true">
      <AvatarFallback className="bg-[#f4dfd5] text-[#995c42]">{message.sender.slice(0, 1)}</AvatarFallback>
    </Avatar>}
    <div className={"flex min-w-0 max-w-[min(83%,38rem)] flex-col gap-1 " + (own ? "items-end" : "items-start")}>
      {!own && <div className="flex gap-2 px-1 text-xs"><strong>{message.sender}</strong><time className="text-[var(--s2-muted)]">{message.time}</time></div>}
      <Card className={"max-w-full gap-0 border-0 py-0 shadow-none " + (own ? "bg-[var(--s2-own)] text-[var(--s2-own-ink)]" : "bg-[var(--s2-wash)] text-[var(--s2-ink)]")}
        style={{ borderRadius: "var(--s2-radius)" }}>
        <CardContent className="p-3 pt-3 text-[13px] leading-relaxed sm:px-3.5">
          {message.reply && <div className="mb-2 flex min-w-0 flex-col border-s-[3px] border-[var(--s2-accent)] ps-2.5 text-xs">
            <strong className="text-[var(--s2-accent)]">{message.reply.sender}</strong>
            <span className="line-clamp-2 break-words opacity-75" dir="auto">{message.reply.text}</span>
          </div>}
          <p className="whitespace-pre-wrap break-words" dir="auto">{message.text}</p>
        </CardContent>
      </Card>
      <div className={"flex min-h-7 flex-wrap items-center gap-1 " + (own ? "justify-end" : "justify-start")}>
        {own && <span className="inline-flex items-center gap-1 px-1 text-[10px] text-[var(--s2-muted)]">
          <time>{message.time}</time><CheckCheck className="size-3.5 text-[var(--s2-accent)]" aria-label="Seen in demo"/>
        </span>}
        {message.reactions?.map(reaction =>
          <Toggle key={reaction.emoji} size="sm" variant="outline" pressed={reacted.includes(conversationId + ":" + message.id + ":" + reaction.emoji)}
            aria-label={"React " + reaction.emoji + " to " + message.sender + "'s message"}
            className="h-7 min-w-0 gap-1 rounded-full border-[var(--s2-line)] bg-[var(--s2-paper)] px-2 text-xs font-normal"
            onPressedChange={() => onReact(message.id, reaction.emoji)}>
            <span>{reaction.emoji}</span><span className="text-[var(--s2-muted)]">{reaction.count}</span>
          </Toggle>)}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-7 text-[var(--s2-muted)]" aria-label={"Message actions: " + message.id}>
              <MoreHorizontal className="size-4"/>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={own ? "end" : "start"} sideOffset={5} collisionPadding={12}>
            <DropdownMenuLabel>Message actions</DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => onReply(message)}><Reply className="size-4"/>Reply</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onCopy(message)}><Copy className="size-4"/>Copy text</DropdownMenuItem>
            <DropdownMenuSeparator/>
            {emojis.map(emoji => <DropdownMenuItem key={emoji} onSelect={() => onReact(message.id, emoji)}>
              <Heart className="size-4"/>React {emoji}
            </DropdownMenuItem>)}
            {own && <>
              <DropdownMenuSeparator/>
              <DropdownMenuItem onSelect={() => onEdit(message)}><Pencil className="size-4"/>Edit local message</DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onSelect={() => onDelete(message)}><Trash2 className="size-4"/>Delete local message</DropdownMenuItem>
            </>}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  </article>;
}
export function MessageTimeline({ conversationName, conversationId, messages, reacted, endRef, onReact, onReply, onEdit, onDelete, onCopy }: MessageTimelineProps) {
  return <ScrollArea className="s2-message-scroll min-h-0 flex-1" aria-label={"Messages in " + conversationName}>
    <div className="s2-message-inner">
      <div className="mx-auto flex max-w-3xl items-center gap-3 pb-6 pt-1">
        <Separator className="flex-1 bg-[var(--s2-line)]"/>
        <Badge variant="outline" className="rounded-full border-[var(--s2-line)] bg-[var(--s2-panel)] px-3 py-1 font-normal text-[var(--s2-muted)]">Friday, November 6</Badge>
        <Separator className="flex-1 bg-[var(--s2-line)]"/>
      </div>
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 pb-4" data-testid="demo-message-list">
        {messages.map(message => <MessageRow key={message.id} message={message} conversationId={conversationId} reacted={reacted} onReact={onReact} onReply={onReply} onEdit={onEdit} onDelete={onDelete} onCopy={onCopy}/>)}
        <div ref={endRef}/>
      </div>
    </div>
  </ScrollArea>;
}
