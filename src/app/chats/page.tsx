"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { api } from "../../../convex/_generated/api";
import { MemberGate } from "@/components/access/member-gate";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GroupCreateDialog } from "@/features/chats/group-create-dialog";
import { GroupInvitations } from "@/features/chats/group-invitations";
import { MessageCircle, UsersRound } from "lucide-react";

export default function ChatsPage() {
  return <MemberGate>{() => <ConversationsList />}</MemberGate>;
}

function ConversationsList() {
  const t = useTranslations("Chats");
  const conversations = useQuery(api.conversations.listMine);
  return <div className="space-y-5">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>
      <GroupCreateDialog />
    </header>
    <GroupInvitations />
    <Card className="rounded-2xl"><CardContent className="space-y-2 p-4">
      {conversations === undefined ? <p role="status">{t("loadingConversations")}</p>
        : conversations.length === 0 ? <div className="space-y-4 p-4">
          <p>{t("emptyConversations")}</p>
          <Button asChild><Link href="/connections">{t("findContacts")}</Link></Button>
        </div> : <ul className="divide-y divide-border">
          {conversations.map(conversation => <li key={conversation.conversationId}>
            <Link href={`/chats/${conversation.conversationId}`} className="flex min-h-16 items-center rounded-xl px-3 py-2 hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring">
              {conversation.kind === "group"
                ? <UsersRound className="me-3 size-5 text-primary" aria-hidden="true" />
                : <MessageCircle className="me-3 size-5 text-muted-foreground" aria-hidden="true" />}
              <span className="font-semibold" dir="auto">{conversation.displayName}</span>
              {conversation.handle && <span className="ms-3 text-sm text-muted-foreground" dir="ltr">@{conversation.handle}</span>}
            </Link>
          </li>)}
        </ul>}
    </CardContent></Card>
  </div>;
}

