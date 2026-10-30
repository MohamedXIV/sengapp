"use client";

import { useTranslations } from "next-intl";
import type { Doc, Id } from "../../../convex/_generated/dataModel";

type TimelineMessage = Pick<Doc<"messages">, "_id" | "senderProfileId" | "body" | "createdAt">;

export function ChatMessageTimeline({ messages, meProfileId, locale, participantNames }: {
  messages: TimelineMessage[];
  meProfileId: Id<"profiles">;
  locale: string;
  participantNames?: Record<string, string>;
}) {
  const t = useTranslations("Chats");
  const ordered = [...messages].reverse();
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

      return <li key={message._id} className={newDay ? "pt-3" : grouped ? "pt-0.5" : "pt-3"}>
        {newDay && <div className="mb-5 flex justify-center">
          <span className="rounded-full border border-border/60 bg-card/90 px-3 py-1 text-[0.7rem] font-medium text-muted-foreground">
            {dayFormatter.format(message.createdAt)}
          </span>
        </div>}
        <div className={`flex items-end gap-2 ${own ? "justify-end" : "justify-start"}`}>
          {!own && participantNames && <span aria-hidden="true" className={`flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary text-[0.7rem] font-bold text-secondary-foreground ${grouped ? "invisible" : ""}`}>
            {name.trim().slice(0, 1).toLocaleUpperCase(locale)}
          </span>}
          <div data-message-owner={own ? "self" : "other"}
            className={`max-w-[85%] min-w-0 rounded-2xl border px-3.5 py-2.5 shadow-[0_1px_2px_hsl(var(--foreground)/0.035)] sm:max-w-[72%] ${own
              ? "rounded-ee-md border-primary/15 bg-primary/12 text-foreground"
              : "rounded-es-md border-border/70 bg-card text-card-foreground"}`}>
            {!own && participantNames && !grouped && <p dir="auto" className="mb-1 text-xs font-semibold text-primary">{name}</p>}
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed" dir="auto">{message.body}</p>
            <time dateTime={new Date(message.createdAt).toISOString()}
              className="mt-1 block text-end text-[0.65rem] tabular-nums text-muted-foreground">
              {timeFormatter.format(message.createdAt)}
            </time>
          </div>
        </div>
      </li>;
    })}
  </ol>;
}
