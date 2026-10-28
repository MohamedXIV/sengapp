"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, SendHorizontal } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface PendingMessage { body: string; clientNonce: string }

export function DirectThread({ conversationId, meProfileId }: {
  conversationId: Id<"conversations">; meProfileId: Id<"profiles">;
}) {
  const t = useTranslations("Chats");
  const locale = useLocale();
  const info = useQuery(api.conversations.getOne, { conversationId });
  const { results, status, loadMore } = usePaginatedQuery(api.messages.list, { conversationId }, { initialNumItems: 25 });
  const send = useMutation(api.messages.send);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<PendingMessage | null>(null);

  async function submit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const body = draft.trim();
    if (busy || !body || body.length > 2_000) return;
    const message = failed?.body === body ? failed : { body, clientNonce: crypto.randomUUID() };
    setBusy(true);
    setFailed(null);
    try {
      await send({ conversationId, ...message });
      setDraft("");
    } catch {
      setFailed(message);
    } finally {
      setBusy(false);
    }
  }

  return <div className="space-y-4">
    <header className="flex items-center gap-3">
      <Button asChild variant="ghost" size="icon" aria-label={t("backToChats")} className="rounded-xl">
        <Link href="/chats"><ArrowLeft className="rtl:rotate-180" aria-hidden="true" /></Link>
      </Button>
      <div>
        <h1 className="text-xl font-bold" dir="auto">{info?.displayName ?? t("loadingConversation")}</h1>
        {info?.handle && <p dir="ltr" className="text-xs text-muted-foreground">@{info.handle}</p>}
      </div>
    </header>
    <Card className="flex min-h-[min(66vh,40rem)] flex-col overflow-hidden rounded-2xl border-border/70">
      <div className="flex-1 space-y-4 px-4 py-5 sm:px-6">
        {status === "LoadingFirstPage" && <p role="status" className="text-sm text-muted-foreground">{t("loadingMessages")}</p>}
        {status === "CanLoadMore" && <Button type="button" size="sm" variant="outline" disabled={busy}
          onClick={() => loadMore(25)}>{t("olderMessages")}</Button>}
        {status === "LoadingMore" && <p role="status" className="text-sm text-muted-foreground">{t("loadingMessages")}</p>}
        {status === "Exhausted" && results.length === 0 && <p className="text-sm text-muted-foreground">{t("noMessages")}</p>}
        <ol role="log" aria-label={t("conversationHistory")} aria-live="polite" className="space-y-3">
          {[...results].reverse().map(message => <li key={message._id}
            className={`flex ${message.senderProfileId === meProfileId ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] space-y-1 rounded-2xl px-4 py-3 text-sm sm:max-w-[75%] ${
              message.senderProfileId === meProfileId ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
            }`}>
              <p className="whitespace-pre-wrap break-words" dir="auto">{message.body}</p>
              <time dateTime={new Date(message.createdAt).toISOString()} className="block text-end text-[0.7rem] opacity-70">
                {new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit" }).format(message.createdAt)}
              </time>
            </div>
          </li>)}
        </ol>
      </div>
      <form onSubmit={(event) => void submit(event)} className="flex items-end gap-2 border-t border-border/70 p-3 sm:p-4">
        <Input aria-label={t("messageInput")} value={draft} maxLength={2000} className="min-h-11 flex-1 rounded-xl"
          placeholder={t("messagePlaceholder")} onChange={event => { setDraft(event.target.value); setFailed(null); }} />
        <Button type="submit" className="min-h-11 rounded-xl" disabled={busy || !draft.trim()}>
          <SendHorizontal aria-hidden="true" />{busy ? t("sending") : t("send")}
        </Button>
      </form>
      {failed && <div role="alert" className="flex items-center gap-2 px-4 pb-4 text-sm text-destructive">
        <span>{t("sendFailed")}</span>
        <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => void submit()}>{t("retry")}</Button>
      </div>}
    </Card>
  </div>;
}
