"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { useLocale, useTranslations } from "next-intl";
import { MessageCircle, Search, UsersRound } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { MemberGate } from "@/components/access/member-gate";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GroupCreateDialog } from "@/features/chats/group-create-dialog";
import { GroupInvitations } from "@/features/chats/group-invitations";

export default function ChatsPage() {
  return <MemberGate>{() => <ConversationsList />}</MemberGate>;
}

function ConversationsList() {
  const t = useTranslations("Chats");
  const locale = useLocale();
  const conversations = useQuery(api.conversations.listMine);
  const [search, setSearch] = useState("");
  const filtered = conversations?.filter(item =>
    `${item.displayName} ${item.handle ?? ""}`.toLocaleLowerCase(locale).includes(search.trim().toLocaleLowerCase(locale))) ?? [];
  const date = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" });

  return <div className="mx-auto max-w-4xl space-y-5">
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold tracking-tight">{t("title")}</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("description")}</p>
      </div>
      <GroupCreateDialog />
    </header>
    <GroupInvitations />
    <Card className="overflow-hidden rounded-3xl border-border/70 shadow-sm">
      <CardContent className="space-y-3 p-3 sm:p-5">
        {conversations !== undefined && conversations.length > 0 && <div className="relative">
          <Search aria-hidden="true" className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input type="search" aria-label={t("searchConversations")} placeholder={t("searchConversations")}
            className="h-11 rounded-xl bg-background/70 ps-10" value={search} onChange={event => setSearch(event.target.value)} />
        </div>}
        {conversations === undefined ? <p role="status" className="p-5 text-sm text-muted-foreground">{t("loadingConversations")}</p>
          : conversations.length === 0 ? <div className="flex flex-col items-center gap-4 px-4 py-12 text-center">
            <span className="flex size-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
              <MessageCircle className="size-7" aria-hidden="true" />
            </span>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">{t("emptyConversations")}</p>
            <Button asChild variant="secondary" className="rounded-xl"><Link href="/connections">{t("findContacts")}</Link></Button>
          </div>
            : filtered.length === 0 ? <p className="px-4 py-10 text-center text-sm text-muted-foreground">{t("noMatchingConversations")}</p>
              : <ul className="space-y-1">
                {filtered.map(item => <li key={item.conversationId}>
                  <Link href={`/chats/${item.conversationId}`}
                    className="group flex min-h-[4.75rem] items-center gap-3 rounded-2xl px-3 py-3 transition-colors hover:bg-accent/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:px-4">
                    <span aria-hidden="true" className={`flex size-12 shrink-0 items-center justify-center rounded-2xl text-sm font-extrabold ${item.kind === "group"
                      ? "bg-primary/12 text-primary" : "bg-secondary text-secondary-foreground"}`}>
                      {item.kind === "group" ? <UsersRound className="size-5" /> : item.displayName.trim().slice(0, 2).toLocaleUpperCase(locale)}
                    </span>
                    <span className="min-w-0 flex-1 space-y-1">
                      <span className="block truncate text-sm font-semibold sm:text-base" dir="auto">{item.displayName}</span>
                      <span className="block truncate text-xs text-muted-foreground" dir={item.handle ? "ltr" : undefined}>
                        {item.handle ? `@${item.handle}` : t("groupConversation")}
                      </span>
                    </span>
                    <time className="shrink-0 self-start pt-1 text-[0.7rem] tabular-nums text-muted-foreground"
                      dateTime={new Date(item.updatedAt).toISOString()}>{date.format(item.updatedAt)}</time>
                  </Link>
                </li>)}
              </ul>}
      </CardContent>
    </Card>
  </div>;
}
