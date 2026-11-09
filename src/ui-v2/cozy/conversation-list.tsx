"use client";

import { MessageCircleIcon, SearchIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { conversations } from "../vanilla/data";
import { useWorkspace } from "../shared/workspace-state";

export function ConversationListPanel({ onSelect }: { onSelect?: () => void }) {
  const t = useTranslations("UiV2");
  const { selectedId, select } = useWorkspace();
  return (
    <section data-testid="cozy-conversations-panel" className="flex h-full min-h-0 flex-col bg-card">
      <div className="border-b p-4">
        <h2 className="text-base font-semibold">{t("chats")}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{t("yourCircle")}</p>
        <div className="relative mt-4">
          <SearchIcon className="pointer-events-none absolute start-3 top-3 size-4 text-muted-foreground" />
          <Input className="ps-9" aria-label={t("searchConversations")} placeholder={t("searchConversations")} />
        </div>
      </div>
      <div className="flex-1 space-y-1 overflow-y-auto p-2">
        <p className="px-3 py-2 text-xs font-medium text-muted-foreground">{t("conversations")}</p>
        {conversations.map(item => (
          <Button
            key={item.id} type="button" variant={selectedId === item.id ? "secondary" : "ghost"}
            className="h-auto w-full justify-start gap-3 px-3 py-3 text-start"
            aria-current={selectedId === item.id ? "page" : undefined}
            onClick={() => { select(item.id); onSelect?.(); }}
          >
            <Avatar className="size-9 shrink-0"><AvatarFallback>{item.initials}</AvatarFallback></Avatar>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{item.name}</span>
              <span className="block truncate text-xs font-normal text-muted-foreground">{item.people}</span>
            </span>
            {item.unread > 0 && <Badge variant="secondary">{item.unread}</Badge>}
          </Button>
        ))}
      </div>
      <Separator />
      <div className="p-3 text-xs text-muted-foreground">
        <MessageCircleIcon className="me-1 inline size-3" /> {t("localPreview")}
      </div>
    </section>
  );
}
