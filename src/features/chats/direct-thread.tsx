"use client";

import { useEffect, useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import Link from "next/link";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeft, MessageCircle, SendHorizontal, UsersRound, X } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { GroupPanel } from "@/features/chats/group-panel";
import { ChatMessageTimeline, type TimelineMessage } from "@/features/chats/chat-message-timeline";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { isPeerOnline, nextSignalExpiry } from "@/lib/presence/session";

interface PendingMessage { body: string; clientNonce: string; replyToMessageId?: Id<"messages"> }

interface ThreadProps {
  conversationId: Id<"conversations">;
  meProfileId: Id<"profiles">;
  embedded?: boolean;
  onBack?: () => void;
}

export function DirectThread(props: ThreadProps) {
  return <ThreadContent key={props.conversationId} {...props} />;
}

function ThreadContent({ conversationId, meProfileId, embedded = false, onBack }: ThreadProps) {
  const t = useTranslations("Chats");
  const locale = useLocale();
  const info = useQuery(api.conversations.getOne, { conversationId });
  const group = useQuery(api.groups.getDetails, info?.kind === "group" ? { conversationId } : "skip");
  const { results, status, loadMore } = usePaginatedQuery(api.messages.list, { conversationId }, { initialNumItems: 25 });
  const send = useMutation(api.messages.send);
  const editMessage = useMutation(api.messages.edit);
  const removeMessage = useMutation(api.messages.remove);
  const toggleReaction = useMutation(api.messages.toggleReaction);
  const setTyping = useMutation(api.activity.setTyping);
  const markRead = useMutation(api.activity.markRead);
  const myProfile = useQuery(api.profiles.getMine);
  // A stable reactive subscription; local time handles lease expiry.
  const signals = useQuery(api.activity.getConversationSignals, { conversationId });
  const [clock, setClock] = useState(() => Date.now());
  const typingLastSent = useRef(0);
  const typingActive = useRef(false);
  const lastMarkedReadId = useRef<string | null>(null);
  const [readScrollRevision, setReadScrollRevision] = useState(0);
  const [draft, setDraft] = useState("");
  const [replyingTo, setReplyingTo] = useState<TimelineMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<TimelineMessage | null>(null);
  const [deletingMessage, setDeletingMessage] = useState<TimelineMessage | null>(null);
  const [actionError, setActionError] = useState(false);
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

  useEffect(() => {
    // A local timeout runs only at the next actual Online/Typing expiry.
    const expiry = nextSignalExpiry(signals?.peerOnlineUntil, signals?.typing, clock);
    if (expiry === null) return;
    const timeout = window.setTimeout(
      () => setClock(Date.now()), Math.max(1, expiry - Date.now() + 20),
    );
    return () => window.clearTimeout(timeout);
  }, [signals, clock]);

  useEffect(() => {
    function onResume() {
      if (document.visibilityState === "visible") setClock(Date.now());
    }
    document.addEventListener("visibilitychange", onResume);
    return () => document.removeEventListener("visibilitychange", onResume);
  }, []);

  useEffect(() => {
    const latest = results[0];
    if (!latest || status === "LoadingFirstPage" || !myProfile?.presencePreferences?.readReceipts) return;
    const read = () => {
      const viewport = scroller.current?.getBoundingClientRect();
      if (!viewport || viewport.width <= 0 || viewport.height <= 0
        || viewport.bottom <= 0 || viewport.right <= 0
        || viewport.top >= window.innerHeight || viewport.left >= window.innerWidth) return;
      if (document.visibilityState !== "visible" || !stickToBottom.current || lastMarkedReadId.current === latest._id) return;
      lastMarkedReadId.current = latest._id;
      void markRead({ conversationId, messageId: latest._id }).catch(() => {
        if (lastMarkedReadId.current === latest._id) lastMarkedReadId.current = null;
      });
    };
    read();
    // Dockview can keep inactive panels mounted; only count a receipt after
    // the actual scroll container enters the viewport again.
    const observer = typeof IntersectionObserver !== "undefined"
      ? new IntersectionObserver(() => read(), { threshold: 0.1 }) : null;
    if (scroller.current) observer?.observe(scroller.current);
    document.addEventListener("visibilitychange", read);
    return () => {
      observer?.disconnect();
      document.removeEventListener("visibilitychange", read);
    };
  }, [conversationId, results, status, myProfile?.presencePreferences?.readReceipts, markRead, readScrollRevision]);

  function broadcastTyping(value: string) {
    if (!myProfile?.presencePreferences?.typingIndicators) return;
    if (!value.trim()) {
      if (typingActive.current) {
        typingActive.current = false;
        typingLastSent.current = 0;
        void setTyping({ conversationId, isTyping: false }).catch(() => {});
      }
      return;
    }
    const now = Date.now();
    if (now - typingLastSent.current < 3_000) return;
    typingActive.current = true;
    typingLastSent.current = now;
    void setTyping({ conversationId, isTyping: true }).catch(() => {});
  }

  useEffect(() => {
    lastMarkedReadId.current = null;
    return () => {
      if (typingActive.current) {
        typingActive.current = false;
        void setTyping({ conversationId, isTyping: false }).catch(() => {});
      }
    };
  }, [conversationId, setTyping]);


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
    setActionError(false);
    if (editingMessage) {
      setBusy(true);
      try {
        await editMessage({ messageId: editingMessage._id, body });
        setEditingMessage(null);
        setDraft("");
      } catch {
        setActionError(true);
      } finally {
        setBusy(false);
      }
      return;
    }
    const replyToMessageId = replyingTo?._id;
    const message: PendingMessage = failed?.body === body && failed.replyToMessageId === replyToMessageId
      ? failed
      : { body, clientNonce: crypto.randomUUID(), ...(replyToMessageId ? { replyToMessageId } : {}) };
    setBusy(true);
    setFailed(null);
    try {
      await send({ conversationId, ...message });
      setDraft("");
      setReplyingTo(null);
      broadcastTyping("");
      stickToBottom.current = true;
    } catch {
      setFailed(message);
    } finally {
      setBusy(false);
    }
  }

  function startReply(message: TimelineMessage) {
    setReplyingTo(message);
    setEditingMessage(null);
    setActionError(false);
    setFailed(null);
  }

  function startEdit(message: TimelineMessage) {
    setEditingMessage(message);
    setReplyingTo(null);
    setDraft(message.body);
    setActionError(false);
    setFailed(null);
    broadcastTyping("");
  }

  function cancelEdit() {
    setEditingMessage(null);
    setDraft("");
    setFailed(null);
    setActionError(false);
  }

  async function deleteSelectedMessage() {
    const selected = deletingMessage;
    setDeletingMessage(null);
    if (!selected) return;
    try {
      await removeMessage({ messageId: selected._id });
      if (editingMessage?._id === selected._id) cancelEdit();
      if (replyingTo?._id === selected._id) setReplyingTo(null);
    } catch {
      setActionError(true);
    }
  }

  function reactTo(message: TimelineMessage, emoji: string) {
    void toggleReaction({ messageId: message._id, emoji }).catch(() => setActionError(true));
  }

  function composerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void submit();
    }
  }

  const peerIsOnline = isPeerOnline(signals?.peerOnlineUntil, clock);
  const typingNames = signals?.typing?.filter(item => item.expiresAt > clock)
    .map(member => member.displayName) ?? [];
  const lastSeenLabel = signals?.peerLastSeenAt
    ? new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(signals.peerLastSeenAt)
    : null;

  const participantNames = group?.members?.reduce<Record<string, string>>((names, member) => {
    names[member.profileId] = member.displayName;
    return names;
  }, {});

  return <div className={embedded ? "sengapp-chat-page flex h-full min-h-0 flex-col gap-2" : "sengapp-chat-page space-y-3"}>
    <header className="flex min-w-0 items-center gap-3 pb-1">
      {onBack
        ? <Button type="button" variant="ghost" size="icon" aria-label={t("backToChats")}
            className="size-11 shrink-0 rounded-xl" onClick={onBack}>
            <ArrowLeft className="rtl:rotate-180" aria-hidden="true" />
          </Button>
        : <Button asChild variant="ghost" size="icon" aria-label={t("backToChats")} className="size-11 shrink-0 rounded-xl">
            <Link href="/chats"><ArrowLeft className="rtl:rotate-180" aria-hidden="true" /></Link>
          </Button>}
      <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        {info?.kind === "group" ? <UsersRound className="size-5" /> : <MessageCircle className="size-5" />}
      </span>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-lg font-bold sm:text-xl" dir="auto">{info?.displayName ?? t("loadingConversation")}</h1>
        {info?.kind === "direct" && info.handle && <p dir="ltr" className="text-xs text-muted-foreground">@{info.handle}</p>}
        {info?.kind === "direct" && peerIsOnline && <p role="status" className="text-xs font-medium text-primary">{t("onlineNow")}</p>}
        {info?.kind === "direct" && !peerIsOnline && lastSeenLabel && <p className="text-xs text-muted-foreground">{t("lastSeenAt", { date: lastSeenLabel })}</p>}
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
    <Card className={embedded
      ? "flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border-border/70 shadow-none"
      : "flex h-[calc(100dvh-12rem)] min-h-80 max-h-[52rem] flex-col overflow-hidden rounded-[1.5rem] border-border/70 shadow-sm"}>
      <div ref={scroller} onScroll={() => {
        const el = scroller.current;
        if (el) {
          const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 96;
          if (atBottom && !stickToBottom.current) setReadScrollRevision(v => v + 1);
          stickToBottom.current = atBottom;
        }
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
          <ChatMessageTimeline messages={results} meProfileId={meProfileId} locale={locale}
            participantNames={info?.kind === "group" ? participantNames ?? {} : undefined}
            readBy={signals?.readBy ?? []}
            onReply={startReply}
            onEdit={startEdit}
            onDelete={setDeletingMessage}
            onReact={reactTo} />
          {typingNames.length > 0 && <p role="status" className="mt-3 px-3 text-xs text-muted-foreground">
            {typingNames.length === 1
              ? t("typingSingle", { name: typingNames[0] ?? "" })
              : t("typingMultiple", { names: typingNames.slice(0, 3).join(", ") })}
          </p>}
        </div>
      </div>
      <form onSubmit={(event) => void submit(event)} className="shrink-0 border-t border-border/70 bg-card/95 p-3 sm:p-4">
        {(replyingTo || editingMessage) && <div className="mb-2 flex items-center gap-2 rounded-xl border-s-2 border-primary/60 bg-secondary/45 px-3 py-2 text-xs">
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{editingMessage ? t("editing") : t("replying")}</p>
            <p className="truncate text-muted-foreground" dir="auto">{(editingMessage ?? replyingTo)?.body}</p>
          </div>
          <Button type="button" variant="ghost" size="icon" className="size-8 shrink-0"
            aria-label={t(editingMessage ? "cancelEdit" : "cancelReply")}
            onClick={() => editingMessage ? cancelEdit() : setReplyingTo(null)}>
            <X className="size-4" aria-hidden="true" />
          </Button>
        </div>}
        <div className="flex items-end gap-2">
          <Textarea aria-label={t("messageInput")} aria-describedby="chat-compose-hint" value={draft} maxLength={2000} rows={1}
            className="max-h-36 min-h-11 flex-1 resize-none rounded-2xl bg-background/75 px-4 py-3 shadow-none"
            placeholder={editingMessage ? t("editing") : t("messagePlaceholder")} onChange={event => { setDraft(event.target.value); setFailed(null); if (!editingMessage) broadcastTyping(event.target.value); }}
            onBlur={() => broadcastTyping("")}
            onKeyDown={composerKeyDown} />
          <Button type="submit" size="icon" className="size-11 shrink-0 rounded-2xl" disabled={busy || !draft.trim()}
            aria-label={editingMessage ? (busy ? t("savingEdit") : t("saveEdit")) : (busy ? t("sending") : t("send"))}>
            <SendHorizontal className="size-5 rtl:rotate-180" aria-hidden="true" />
          </Button>
        </div>
        <p id="chat-compose-hint" className="mt-2 hidden text-xs text-muted-foreground sm:block">{t("composerHint")}</p>
        {actionError && <p role="alert" className="mt-2 text-sm text-destructive">{t("actionFailed")}</p>}
        {failed && <div role="alert" className="mt-2 flex flex-wrap items-center gap-2 text-sm text-destructive">
          <span>{t("sendFailed")}</span>
          <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => void submit()}>{t("retry")}</Button>
        </div>}
      </form>
    </Card>
    <AlertDialog open={deletingMessage !== null} onOpenChange={open => { if (!open) setDeletingMessage(null); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("deleteTitle")}</AlertDialogTitle>
          <AlertDialogDescription>{t("deleteDescription")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("dialogCancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={() => void deleteSelectedMessage()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {t("confirmDelete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>;
}
