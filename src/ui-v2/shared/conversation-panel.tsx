"use client";

import { MessageCircleDashedIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { cn } from "@/lib/utils";
import { VanillaTimeline } from "../vanilla/timeline";
import { VanillaComposer } from "../vanilla/composer";
import { useWorkspace } from "./workspace-state";

/** One conversation tree for both shells; companion identity lives in global settings. */
export function SharedConversationPanel({ embedded = false, className }: {
  embedded?: boolean; className?: string;
}) {
  const t = useTranslations("UiV2");
  const workspace = useWorkspace();
  const { title, conversation, messages, view } = workspace;
  const subtitle = conversation?.id === "sara" ? t("directMessage") : conversation?.id === "team" ? t("memberCount",{count:6}) : conversation?.id === "friends" ? t("memberCount",{count:3}) : workspace.selectedId==="new" ? t("newConversationDesc") : "";
  return (
    <Card data-testid="shared-conversation-panel"
      className={cn("flex h-full min-h-0 min-w-0 w-full flex-1 flex-col gap-0 overflow-hidden",
        embedded ? "rounded-none border-0 shadow-none" : "rounded-xl", className)}>
      {view === "Chats" ? (
        <>
          <CardHeader data-testid="conversation-header"
            className="flex-row items-center gap-3 border-b px-4 py-2.5 sm:px-5 sm:py-3">
            <Avatar className="size-9 shrink-0">
              <AvatarFallback>{conversation?.initials ?? "✳"}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <CardTitle className="truncate text-sm font-semibold" role="heading" aria-level={1}>{title}</CardTitle>
              <CardDescription className="truncate text-xs">{subtitle}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 p-0">
            {messages.length ? (
              <VanillaTimeline key={workspace.selectedId} conversationId={workspace.selectedId}
                messages={messages} decisions={workspace.decisions} onDecision={workspace.decide} />
            ) : (
              <Empty className="h-full">
                <EmptyHeader>
                  <EmptyMedia variant="icon"><MessageCircleDashedIcon /></EmptyMedia>
                  <EmptyTitle>{t("startConversation")}</EmptyTitle>
                  <EmptyDescription>{t("startConversationDesc")}</EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
          <div data-testid="floating-composer" className="shrink-0 px-3 pb-3 pt-2 sm:px-5 sm:pb-5">
            <VanillaComposer text={workspace.draft} onTextChange={workspace.setDraft}
              onSend={workspace.send} companion={workspace.companion} />
          </div>
        </>
      ) : (
        <CardContent className="flex min-h-0 flex-1">
          <Empty className="h-full">
            <EmptyHeader>
              <EmptyMedia variant="icon"><MessageCircleDashedIcon /></EmptyMedia>
              <EmptyTitle>{view}</EmptyTitle>
              <EmptyDescription>{t("placeholderView")}</EmptyDescription>
            </EmptyHeader>
            <Button variant="outline" onClick={() => workspace.navigate("Chats")}>{t("backToConversations")}</Button>
          </Empty>
        </CardContent>
      )}
    </Card>
  );
}
