"use client";

import { CheckCheck, Copy, Heart, MoreHorizontal, Pencil, Reply, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bubble, BubbleContent, BubbleReactions } from "@/components/ui/bubble";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Marker, MarkerContent } from "@/components/ui/marker";
import { Message, MessageAvatar, MessageContent, MessageFooter, MessageHeader } from "@/components/ui/message";
import {
  MessageScroller, MessageScrollerButton, MessageScrollerContent, MessageScrollerItem,
  MessageScrollerProvider, MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import { Toggle } from "@/components/ui/toggle";
import type { DemoMessage } from "./studio-data";

export interface MessageTimelineProps {
  conversationName: string;
  conversationId: string;
  messages: DemoMessage[];
  reacted: readonly string[];
  onReact: (id: string, emoji: string) => void;
  onReply: (message: DemoMessage) => void;
  onEdit: (message: DemoMessage) => void;
  onDelete: (message: DemoMessage) => void;
  onCopy: (message: DemoMessage) => void;
}

const quickReactions = ["💜", "❤️", "👏", "🚀"];

function MessageRow({
  message, conversationId, reacted, onReact, onReply, onEdit, onDelete, onCopy,
}: Omit<MessageTimelineProps, "conversationName" | "messages"> & { message: DemoMessage }) {
  const own = Boolean(message.own);
  return <Message align={own ? "end" : "start"}>
    {!own && <MessageAvatar>
      <Avatar className="size-8" aria-hidden="true">
        <AvatarFallback className="bg-secondary text-secondary-foreground">{message.sender.slice(0, 1)}</AvatarFallback>
      </Avatar>
    </MessageAvatar>}
    <MessageContent>
      {!own && <MessageHeader>
        <span className="font-semibold text-foreground">{message.sender}</span>
        <time className="ms-2 font-normal">{message.time}</time>
      </MessageHeader>}
      <Bubble variant={own ? "default" : "muted"} align={own ? "end" : "start"}>
        <BubbleContent>
          {message.reply && <div className="mb-2 flex min-w-0 flex-col gap-0.5 border-s-2 border-current/40 ps-2 text-xs">
            <strong>{message.reply.sender}</strong>
            <span dir="auto" className="line-clamp-2 opacity-80">{message.reply.text}</span>
          </div>}
          <p className="whitespace-pre-wrap break-words" dir="auto">{message.text}</p>
        </BubbleContent>
        {Boolean(message.reactions?.length) && <BubbleReactions
          side="bottom" align={own ? "end" : "start"} className="bg-background ring-background">
          {message.reactions?.map(reaction =>
            <Toggle key={reaction.emoji} variant="outline" size="sm"
              pressed={reacted.includes(conversationId + ":" + message.id + ":" + reaction.emoji)}
              onPressedChange={() => onReact(message.id, reaction.emoji)}
              aria-label={"React " + reaction.emoji + " to " + message.sender + "'s message"}
              className="h-7 min-w-0 gap-1 rounded-full border-border bg-background px-2 text-xs font-normal">
              <span>{reaction.emoji}</span><span className="text-muted-foreground">{reaction.count}</span>
            </Toggle>)}
        </BubbleReactions>}
      </Bubble>
      <MessageFooter className={message.reactions?.length ? "pt-4" : ""}>
        {own && <span className="inline-flex items-center gap-1">
          <time>{message.time}</time><CheckCheck className="size-3.5 text-primary" aria-label="Seen in demo"/>
        </span>}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-7" aria-label={"Message actions: " + message.id}>
              <MoreHorizontal className="size-4"/>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={own ? "end" : "start"} sideOffset={5} collisionPadding={12}>
            <DropdownMenuLabel>Message actions</DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => onReply(message)}><Reply className="size-4"/>Reply</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onCopy(message)}><Copy className="size-4"/>Copy text</DropdownMenuItem>
            <DropdownMenuSeparator/>
            {quickReactions.map(emoji =>
              <DropdownMenuItem key={emoji} onSelect={() => onReact(message.id, emoji)}>
                <Heart className="size-4"/>React {emoji}
              </DropdownMenuItem>)}
            {own && <>
              <DropdownMenuSeparator/>
              <DropdownMenuItem onSelect={() => onEdit(message)}><Pencil className="size-4"/>Edit local message</DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onSelect={() => onDelete(message)}>
                <Trash2 className="size-4"/>Delete local message
              </DropdownMenuItem>
            </>}
          </DropdownMenuContent>
        </DropdownMenu>
      </MessageFooter>
    </MessageContent>
  </Message>;
}

export function MessageTimeline({
  conversationName, conversationId, messages, reacted, onReact, onReply, onEdit, onDelete, onCopy,
}: MessageTimelineProps) {
  return <MessageScrollerProvider key={conversationId} autoScroll defaultScrollPosition="end">
    <MessageScroller className="s2-message-scroll min-h-0 flex-1" aria-label={"Messages in " + conversationName}>
      <MessageScrollerViewport className="scroll-fade-b" aria-label={"Messages in " + conversationName}>
        <MessageScrollerContent className="mx-auto w-full max-w-3xl gap-4 px-4 py-5 sm:px-8">
          <MessageScrollerItem messageId={conversationId + "-date"}>
            <Marker variant="separator" className="justify-center text-xs">
              <MarkerContent>Friday, November 6</MarkerContent>
            </Marker>
          </MessageScrollerItem>
          {messages.map(message =>
            <MessageScrollerItem key={message.id} messageId={message.id} scrollAnchor={false}>
              <MessageRow message={message} conversationId={conversationId} reacted={reacted}
                onReact={onReact} onReply={onReply} onEdit={onEdit} onDelete={onDelete} onCopy={onCopy}/>
            </MessageScrollerItem>)}
        </MessageScrollerContent>
      </MessageScrollerViewport>
      <MessageScrollerButton/>
    </MessageScroller>
  </MessageScrollerProvider>;
}
