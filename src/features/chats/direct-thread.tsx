"use client";

import { useEffect, useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import Link from "next/link";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, MessageCircle, SendHorizontal, UsersRound } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { GroupPanel } from "@/features/chats/group-panel";
import { ChatMessageTimeline } from "@/features/chats/chat-message-timeline";

interface PendingMessage { body: string; clientNonce: string }

export function DirectThread({ conversationId, meProfileId }: {
  conversationId: Id<"conversations">; meProfileId: Id<"profiles">;
}) {
  const t = useTranslations("Chats");
  const locale = useLocale();
  const info = useQuery(api.conversations.getOne, { conversationId });
  const group = useQuery(api.groups.getDetails, info?.kind === "group" ? { conversationId } : "skip");
  const { results, status, loadMore } = usePaginatedQuery(api.messages.list, { conversationId }, { initialNumItems: 25 });
  const send = useMutation(api.messages.send);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState<PendingMessage | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const initialized = useRef<string | null>(null);
  const stickToBottom = useRef(true);
  const restoreOlder = useRef<{ height: number; top: number } | null>(null);

  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el || status === "LoadingFirstPage") return;
    if (initialized.current !== conversationId) {
      el.scrollTop = el.scrollHeight;
      initialized.current = conversationId;
      stickToBottom.current = true;
    } else if (restoreOlder.current && status !== "LoadingMore") {
      const old = restoreOlder.current;
      el.scrollTop = old.top + el.scrollHeight - old.height;
      restoreOlder.current = null;
    } else if (stickToBottom.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [conversationId, results.length, status]);

  useEffect(() => {
    initialized.current = null;
    restoreOlder.current = null;
    stickToBottom.current = true;
  }, [conversationId]);

  function loadOlder() {
    if (status !== "CanLoadMore") return;
    const el = scroller.current;
    if (el) restoreOlder.current = { height: el.scrollHeight, top: el.scrollTop };
    loadMore(25);
  }

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
      stickToBottom.current = true;
    } catch {
      setFailed(message);
    } finally {
      setBusy(false);
    }
  }

  function composerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void submit();
    }
  }

  const participantNames = group?.members?.reduce<Record<string, string>>((names, member) => {
    names[member.profileId] = member.displayName;
    return names;
  }, {});

  return <div className="sengapp-chat-page space-y-3">
    <header className="flex min-w-0 items-center gap-3 pb-1">
      <Button asChild variant="ghost" size="icon" aria-label={t("backToChats")} className="size-11 shrink-0 rounded-xl">
        <Link href="/chats"><ArrowLeft className="rtl:rotate-180" aria-hidden="true" /></Link>
      </Button>
      <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        {info?.kind === "group" ? <UsersRound className="size-5" /> : <MessageCircle className="size-5" />}
      </span>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-lg font-bold sm:text-xl" dir="auto">{info?.displayName ?? t("loadingConversation")}</h1>
        {info?.kind === "direct" && info.handle && <p dir="ltr" className="text-xs text-muted-foreground">@{info.handle}</p>}
        {info?.kind === "group" && <p className="text-xs text-muted-foreground">{t("members")} · {group?.members.length ?? "…"}</p>}
      </div>
      {info?.kind === "group" && <Sheet>
        <SheetTrigger asChild>
          <Button type="button" size="sm" variant="outline" className="min-h-11 shrink-0 rounded-xl" aria-label={t("groupDetails")}>
            <UsersRound className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">{t("groupDetails")}</span>
          </Button>
        </SheetTrigger>
        <SheetContent side={locale === "ar" ? "left" : "right"} className="flex h-full w-[min(100vw,30rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
          <SheetHeader className="shrink-0 space-y-2 border-b px-5 py-6 pe-12">
            <SheetTitle>{t("groupDetails")}</SheetTitle>
            <SheetDescription>{t("groupPrivacyNote")}</SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
            <GroupPanel conversationId={conversationId} meProfileId={meProfileId} />
          </div>
        </SheetContent>
      </Sheet>}
    </header>
    <Card className="flex h-[calc(100dvh-12rem)] min-h-80 max-h-[52rem] flex-col overflow-hidden rounded-[1.5rem] border-border/70 shadow-sm">
      <div ref={scroller} onScroll={() => {
        const el = scroller.current;
        if (el) stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 96;
      }} className="sengapp-chat-messages min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="flex min-h-full flex-col justify-end px-3 py-5 sm:px-6">
          {status === "LoadingFirstPage" && <div role="status" aria-label={t("loadingMessages")} className="space-y-5 py-4">
            <span className="sr-only">{t("loadingMessages")}</span>
            <Skeleton className="h-12 w-1/2 max-w-full rounded-2xl" />
            <Skeleton className="ms-auto h-16 w-3/5 max-w-full rounded-2xl" />
            <Skeleton className="h-10 w-2/5 max-w-full rounded-2xl" />
          </div>}
          {status === "CanLoadMore" && <Button type="button" size="sm" variant="outline" className="mx-auto mb-5 rounded-full"
            disabled={busy} onClick={loadOlder}>{t("olderMessages")}</Button>}
          {status === "LoadingMore" && <p role="status" className="mb-5 text-center text-sm text-muted-foreground">{t("loadingMessages")}</p>}
          {status === "Exhausted" && results.length === 0 && <div className="mx-auto my-auto flex max-w-xs flex-col items-center gap-3 py-10 text-center text-sm text-muted-foreground">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><MessageCircle aria-hidden="true" /></span>
            <p>{t("noMessages")}</p>
          </div>}
          <ChatMessageTimeline messages={results} meProfileId={meProfileId} locale={locale} participantNames={info?.kind === "group" ? participantNames ?? {} : undefined} />
        </div>
      </div>
      <form onSubmit={(event) => void submit(event)} className="shrink-0 border-t border-border/70 bg-card/95 p-3 sm:p-4">
        <div className="flex items-end gap-2">
          <Textarea aria-label={t("messageInput")} aria-describedby="chat-compose-hint" value={draft} maxLength={2000} rows={1}
            className="max-h-36 min-h-11 flex-1 resize-none rounded-2xl bg-background/75 px-4 py-3 shadow-none"
            placeholder={t("messagePlaceholder")} onChange={event => { setDraft(event.target.value); setFailed(null); }}
            onKeyDown={composerKeyDown} />
          <Button type="submit" size="icon" className="size-11 shrink-0 rounded-2xl" disabled={busy || !draft.trim()}
            aria-label={busy ? t("sending") : t("send")}>
            <SendHorizontal className="size-5 rtl:rotate-180" aria-hidden="true" />
          </Button>
        </div>
        <p id="chat-compose-hint" className="mt-2 hidden text-xs text-muted-foreground sm:block">{t("composerHint")}</p>
        {failed && <div role="alert" className="mt-2 flex flex-wrap items-center gap-2 text-sm text-destructive">
          <span>{t("sendFailed")}</span>
          <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => void submit()}>{t("retry")}</Button>
        </div>}
      </form>
    </Card>
  </div>;
}
