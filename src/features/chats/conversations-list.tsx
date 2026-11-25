"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { useLocale, useTranslations } from "next-intl";
import { MessageCircle, Search, UsersRound } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { GroupCreateDialog } from "@/features/chats/group-create-dialog";
import { GroupInvitations } from "@/features/chats/group-invitations";

export function ConversationsList({
  compact = false,
  activeConversationId,
  onSelect,
}: {
  compact?: boolean;
  activeConversationId?: Id<"conversations"> | null;
  onSelect?: (conversationId: Id<"conversations">) => void;
}) {
  const t = useTranslations("Chats");
  const locale = useLocale();
  const conversations = useQuery(api.conversations.listMine);
  const [search, setSearch] = useState("");
  const filtered = conversations?.filter(item =>
    `${item.displayName} ${item.handle ?? ""}`.toLocaleLowerCase(locale).includes(search.trim().toLocaleLowerCase(locale))) ?? [];
  const date = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" });

  return <div className={compact ? "flex h-full min-h-0 flex-col gap-3" : "mx-auto max-w-4xl space-y-5"}>
    {!compact && <header className="flex flex-wrap items-center justify-between gap-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{t("title")}</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("description")}</p>
      </div>
      <GroupCreateDialog />
    </header>}
    {!compact && <GroupInvitations />}
    <Card className={compact ? "flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border-border/70 shadow-none" : "overflow-hidden rounded-[1.5rem] border-border/70 shadow-sm"}>
      <CardContent className={compact ? "flex min-h-0 flex-1 flex-col gap-2.5 p-2.5" : "space-y-3 p-3 sm:p-5"}>
        {conversations !== undefined && conversations.length > 0 && <div className="relative">
          <Search aria-hidden="true" className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input type="search" aria-label={t("searchConversations")} placeholder={t("searchConversations")}
            className="h-10 rounded-full bg-background/70 ps-10" value={search} onChange={event => setSearch(event.target.value)} />
        </div>}
        {conversations === undefined ? <div role="status" aria-label={t("loadingConversations")} className="space-y-3 p-2">
          <span className="sr-only">{t("loadingConversations")}</span>
          {Array.from({ length: 4 }, (_, index) => <div key={index} className="flex items-center gap-3 py-1">
            <Skeleton className="size-11 shrink-0 rounded-2xl" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-44 max-w-full" /><Skeleton className="h-3 w-28 max-w-full" /></div>
          </div>)}
        </div>
          : conversations.length === 0 ? <div className="flex flex-col items-center gap-4 px-4 py-12 text-center">
            <span className="flex size-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
              <MessageCircle className="size-7" aria-hidden="true" />
            </span>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">{t("emptyConversations")}</p>
            <Button asChild variant="secondary" className="rounded-xl"><Link href="/connections">{t("findContacts")}</Link></Button>
          </div>
            : filtered.length === 0 ? <p className="px-4 py-10 text-center text-sm text-muted-foreground">{t("noMatchingConversations")}</p>
              : <ul className={compact ? "min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain" : "space-y-1.5"}>
                {filtered.map(item => {
                  const isActive = activeConversationId === item.conversationId;
                  return <li key={item.conversationId}>
                    {onSelect
                      ? <button type="button" onClick={() => onSelect(item.conversationId)}
                        data-conversation-active={isActive ? "true" : undefined}
                        className="group flex w-full min-h-[4.25rem] items-center gap-3 rounded-2xl border border-transparent px-3 py-2.5 text-start transition-all hover:border-border/70 hover:bg-accent/55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:px-3.5">
                        <ConversationRow item={item} locale={locale} date={date} groupLabel={t("groupConversation")}/>
                      </button>
                      : <Link href={`/chats/${item.conversationId}`}
                        data-conversation-active={isActive ? "true" : undefined}
                        aria-current={isActive ? "page" : undefined}
                        className="group flex min-h-[4.25rem] items-center gap-3 rounded-2xl border border-transparent px-3 py-2.5 transition-all hover:border-border/70 hover:bg-accent/55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:px-3.5">
                        <ConversationRow item={item} locale={locale} date={date} groupLabel={t("groupConversation")}/>
                      </Link>}
                  </li>;
                })}
              </ul>}
      </CardContent>
    </Card>
  </div>;
}

function ConversationRow({ item, locale, date, groupLabel }: {
  item: { kind: "direct" | "group"; displayName: string; handle?: string | null; updatedAt: number };
  locale: string; date: Intl.DateTimeFormat; groupLabel: string;
}) {
  return <>
    <span aria-hidden="true" className={`flex size-11 shrink-0 items-center justify-center rounded-2xl text-sm font-extrabold shadow-xs ${item.kind === "group"
      ? "bg-primary/14 text-primary" : "bg-secondary text-secondary-foreground"}`}>
      {item.kind === "group" ? <UsersRound className="size-5" /> : item.displayName.trim().slice(0, 2).toLocaleUpperCase(locale)}
    </span>
    <span className="min-w-0 flex-1 space-y-0.5">
      <span className="block truncate text-sm font-semibold sm:text-[0.95rem]" dir="auto">{item.displayName}</span>
      <span className="block truncate text-xs text-muted-foreground" dir={item.handle ? "ltr" : undefined}>
        {item.handle ? `@${item.handle}` : groupLabel}
      </span>
    </span>
    <time className="shrink-0 self-start pt-0.5 text-[0.7rem] tabular-nums text-muted-foreground"
      dateTime={new Date(item.updatedAt).toISOString()}>{date.format(item.updatedAt)}</time>
  </>;
}
