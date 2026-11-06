"use client";

import { useTranslations } from "next-intl";
import { Marker, MarkerContent } from "@/components/ui/marker";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
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

  return <ol role="log" aria-label={t("conversationHistory")} aria-live="polite" aria-relevant="additions text" className="space-y-1">
    {ordered.map((message, index) => {
      const previous = ordered[index - 1];
      const newDay = !previous || dayFormatter.format(previous.createdAt) !== dayFormatter.format(message.createdAt);
      const grouped = !newDay && previous?.senderProfileId === message.senderProfileId
        && message.createdAt - previous.createdAt <= 5 * 60 * 1000;
      const own = message.senderProfileId === meProfileId;
      const name = participantNames?.[message.senderProfileId] ?? t("groupParticipant");
      const canAct = !message.deletedAt && onReply && onReact;

      return <li key={message._id} data-message-id={message._id}
        className={newDay ? "pt-3" : grouped ? "pt-0.5" : "pt-3"}>
        {newDay && <Marker variant="separator" className="mb-5">
          <MarkerContent className="rounded-full border border-border/60 bg-card/90 px-3 py-1 font-medium">
            {dayFormatter.format(message.createdAt)}
          </MarkerContent>
        </Marker>}
        <div className={`group/message flex items-end gap-1 ${own ? "justify-end" : "justify-start"}`}>
          {!own && participantNames && <span aria-hidden="true"
            className={`flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-[0.7rem] font-bold text-secondary-foreground ${grouped ? "invisible" : ""}`}>
            {name.trim().slice(0, 1).toLocaleUpperCase(locale)}
          </span>}
          <Bubble data-message-owner={own ? "self" : "other"}
            align={own ? "end" : "start"} variant={own ? "tinted" : "muted"}
            className={own ? "rounded-ee-md" : "rounded-es-md"}>
            <BubbleContent>
              {!own && participantNames && !grouped && <p dir="auto" className="mb-1 text-xs font-semibold text-primary">{name}</p>}
              {message.replyToMessageId && <div className="mb-2 max-w-full border-s-2 border-primary/40 bg-background/45 px-2 py-1 text-xs text-muted-foreground"
                data-testid="reply-preview" dir="auto">
                <span className="block font-semibold">{t("reply")}</span>
                <span className="line-clamp-2 break-words">{message.replyPreview?.body ?? t("replyUnavailable")}</span>
              </div>}
              {message.deletedAt
                ? <p className="text-sm italic text-muted-foreground">{t("messageDeleted")}</p>
                : <p className="whitespace-pre-wrap break-words text-sm leading-relaxed" dir="auto">{message.body}</p>}
              <div className="mt-1 flex justify-end gap-1 text-[0.65rem] text-muted-foreground">
                {!message.deletedAt && message.editedAt && <span>{t("edited")}</span>}
                <time dateTime={new Date(message.createdAt).toISOString()} className="tabular-nums">
                  {timeFormatter.format(message.createdAt)}
                </time>
              </div>
            </BubbleContent>
          </Bubble>
          {canAct && <div className="self-end sm:opacity-0 sm:group-hover/message:opacity-100 sm:group-focus-within/message:opacity-100">
            <MessageActions own={own} meProfileId={meProfileId} reactions={message.reactions}
              onReply={() => onReply(message)}
              onEdit={own && onEdit ? () => onEdit(message) : undefined}
              onDelete={own && onDelete ? () => onDelete(message) : undefined}
              onReact={emoji => onReact(message, emoji)} />
          </div>}
        </div>
        {own && message._id === lastOwn && readBy.some(reader => reader.readThroughAt >= message.createdAt) && <p
          role="status" className="mt-1 text-end text-[0.7rem] text-muted-foreground" dir="auto">
          {participantNames
            ? t("readBy", { names: readBy.filter(reader => reader.readThroughAt >= message.createdAt).map(reader => reader.displayName).join(", ") })
            : t("seen")}
        </p>}
      </li>;
    })}
  </ol>;
}
