"use client";

import { useTranslations } from "next-intl";
import { Marker, MarkerContent } from "@/components/ui/marker";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Message, MessageAvatar, MessageContent, MessageFooter, MessageHeader } from "@/components/ui/message";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageActions } from "@/features/chats/message-actions";
import type { Doc, Id } from "../../../convex/_generated/dataModel";

export type TimelineMessage = Pick<Doc<"messages">,
  "_id" | "senderProfileId" | "body" | "createdAt" | "editedAt" | "deletedAt" | "reactions" | "replyToMessageId">
  & { replyPreview?: { body: string | null; senderProfileId: Id<"profiles"> | null } };

export function ChatMessageTimeline({
  messages, meProfileId, locale, participantNames, readBy = [], onReply, onEdit, onDelete, onReact,
}: {
  messages: TimelineMessage[];
  meProfileId: Id<"profiles">;
  locale: string;
  participantNames?: Record<string, string>;
  readBy?: { profileId: Id<"profiles">; displayName: string; readThroughAt: number }[];
  onReply?: (message: TimelineMessage) => void;
  onEdit?: (message: TimelineMessage) => void;
  onDelete?: (message: TimelineMessage) => void;
  onReact?: (message: TimelineMessage, emoji: string) => void;
}) {
  const t = useTranslations("Chats");
  const ordered = [...messages].reverse();
  const lastOwn = [...ordered].reverse().find(message => message.senderProfileId === meProfileId)?._id;
  const dayFormatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
  const timeFormatter = new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit" });

  return <ol role="log" aria-label={t("conversationHistory")}
    aria-live="polite" aria-relevant="additions text" className="space-y-1">
    {ordered.map((message, index) => {
      const previous = ordered[index - 1];
      const newDay = !previous || dayFormatter.format(previous.createdAt) !== dayFormatter.format(message.createdAt);
      const grouped = !newDay && previous?.senderProfileId === message.senderProfileId
        && message.createdAt - previous.createdAt <= 5 * 60 * 1000;
      const own = message.senderProfileId === meProfileId;
      const name = participantNames?.[message.senderProfileId] ?? t("groupParticipant");
      const canAct = !message.deletedAt && onReply && onReact;
      const seenBy = own && message._id === lastOwn
        ? readBy.filter(reader => reader.readThroughAt >= message.createdAt) : [];

      return <li key={message._id} data-message-id={message._id}
        className={newDay ? "pt-3" : grouped ? "pt-0.5" : "pt-3"}>
        {newDay && <Marker variant="separator" className="mb-5">
          <MarkerContent className="rounded-full border border-border/60 bg-card/90 px-3 py-1 font-medium">
            {dayFormatter.format(message.createdAt)}
          </MarkerContent>
        </Marker>}
        <Message align={own ? "end" : "start"} data-message-owner={own ? "self" : "other"}>
          {!own && participantNames && <MessageAvatar className={grouped ? "invisible" : ""}>
            <Avatar size="sm">
              <AvatarFallback className="bg-secondary text-secondary-foreground font-semibold">
                {name.trim().slice(0, 1).toLocaleUpperCase(locale)}
              </AvatarFallback>
            </Avatar>
          </MessageAvatar>}
          <MessageContent className="gap-1.5">
            {!own && participantNames && !grouped && <MessageHeader>{name}</MessageHeader>}
            <Bubble align={own ? "end" : "start"} variant={own ? "tinted" : "muted"}>
              <BubbleContent className={own ? "rounded-ee-md" : "rounded-es-md"}>
                {message.replyToMessageId && <div
                  className="mb-2 max-w-full border-s-2 border-primary/40 bg-background/45 px-2 py-1 text-xs text-muted-foreground"
                  data-testid="reply-preview" dir="auto">
                  <span className="block font-semibold">{t("reply")}</span>
                  <span className="line-clamp-2 break-words">{message.replyPreview?.body ?? t("replyUnavailable")}</span>
                </div>}
                {message.deletedAt
                  ? <p className="italic text-muted-foreground">{t("messageDeleted")}</p>
                  : <p className="whitespace-pre-wrap break-words text-sm leading-relaxed" dir="auto">{message.body}</p>}
              </BubbleContent>
            </Bubble>
            <MessageFooter className="flex-wrap gap-x-2 gap-y-1 px-1">
              <time dateTime={new Date(message.createdAt).toISOString()} className="text-[0.7rem] tabular-nums">
                {timeFormatter.format(message.createdAt)}
              </time>
              {!message.deletedAt && message.editedAt && <span className="text-[0.7rem]">{t("edited")}</span>}
              {canAct && <MessageActions own={own} meProfileId={meProfileId} reactions={message.reactions}
                onReply={() => onReply(message)}
                onEdit={own && onEdit ? () => onEdit(message) : undefined}
                onDelete={own && onDelete ? () => onDelete(message) : undefined}
                onReact={emoji => onReact(message, emoji)} />}
            </MessageFooter>
            {seenBy.length > 0 && <MessageFooter role="status" className="px-1 text-[0.7rem]" dir="auto">
              {participantNames ? t("readBy", { names: seenBy.map(reader => reader.displayName).join(", ") }) : t("seen")}
            </MessageFooter>}
          </MessageContent>
        </Message>
      </li>;
    })}
  </ol>;
}
