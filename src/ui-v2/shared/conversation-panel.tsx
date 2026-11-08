"use client";

import { useState, type FormEvent } from "react";
import { BotIcon, MessageCircleDashedIcon, SquarePenIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { exampleAgentConsent } from "../vanilla/data";
import { VanillaTimeline } from "../vanilla/timeline";
import { VanillaComposer } from "../vanilla/composer";
import { useWorkspace } from "./workspace-state";

/** The SAME conversation content renders in Classic and Cozy Dockview panels. */
export function SharedConversationPanel({ embedded = false, className }: {
  embedded?: boolean; className?: string;
}) {
  const workspace = useWorkspace();
  const [setupOpen, setSetupOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [handleDraft, setHandleDraft] = useState("");
  const { companion, title, subtitle, conversation, messages, view } = workspace;

  function saveIdentity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = nameDraft.trim(), handle = handleDraft.trim().toLowerCase();
    if (!name || name.length > 40 || !/^[a-z][a-z0-9_]{1,23}$/.test(handle)) return;
    workspace.saveCompanion(name, handle);
    setSetupOpen(false);
  }

  return (
    <Card
      data-testid="shared-conversation-panel"
      className={cn(
        "flex h-full min-h-0 min-w-0 w-full flex-1 flex-col gap-0 overflow-hidden",
        embedded ? "rounded-none border-0 shadow-none" : "rounded-xl",
        className,
      )}
    >
      {view === "Chats" ? (
        <>
          <CardHeader className="flex-row items-center justify-between gap-3 border-b px-4 py-4 sm:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar className="shrink-0">
                <AvatarFallback>{conversation?.initials ?? "✳"}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <CardTitle className="truncate" role="heading" aria-level={1}>{title}</CardTitle>
                <CardDescription className="truncate">{subtitle}</CardDescription>
                <Badge variant="outline" className="mt-1 max-w-full truncate text-[10px] font-normal">
                  <BotIcon className="me-1 size-3 shrink-0" />
                  {!companion
                    ? "Choose your own companion alias"
                    : exampleAgentConsent[workspace.selectedId]
                      ? "@" + companion.handle + " · sample consent"
                      : "@" + companion.handle + " · consent required"}
                </Badge>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
              <Dialog open={setupOpen} onOpenChange={setSetupOpen}>
                <DialogTrigger asChild>
                  <Button
                    type="button" variant="outline" size="sm"
                    aria-label={companion ? "Edit companion" : "Name your companion"}
                    onClick={() => {
                      setNameDraft(companion?.name ?? "");
                      setHandleDraft(companion?.handle ?? "");
                    }}
                  >
                    <BotIcon className="size-4" />
                    <span className="hidden sm:inline">{companion ? "Edit companion" : "Name your companion"}</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={saveIdentity} className="space-y-4">
                    <DialogHeader>
                      <DialogTitle>Choose your companion&apos;s identity</DialogTitle>
                      <DialogDescription>
                        Set your own display name and @mention alias. Nothing here contacts an AI provider.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                      <Label htmlFor="companion-display-name">Companion display name</Label>
                      <Input
                        id="companion-display-name" maxLength={40} required
                        placeholder="Any name, including Arabic" value={nameDraft}
                        onChange={event => setNameDraft(event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companion-mention-alias">Mention alias</Label>
                      <Input
                        id="companion-mention-alias" maxLength={24} minLength={2} required
                        pattern="[a-zA-Z][a-zA-Z0-9_]{1,23}"
                        placeholder="e.g. star_helper" autoCapitalize="none" spellCheck={false}
                        value={handleDraft} onChange={event => setHandleDraft(event.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Latin letters, digits and underscores, 2–24 characters.
                      </p>
                    </div>
                    <DialogFooter><Button type="submit">Save companion</Button></DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
              <Button
                variant="outline" size="icon" aria-label="New conversation"
                onClick={() => workspace.select("new")}
              >
                <SquarePenIcon />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 p-0">
            {messages.length ? (
              <VanillaTimeline
                key={workspace.selectedId} conversationId={workspace.selectedId}
                messages={messages} decisions={workspace.decisions} onDecision={workspace.decide}
              />
            ) : (
              <Empty className="h-full">
                <EmptyHeader>
                  <EmptyMedia variant="icon"><MessageCircleDashedIcon /></EmptyMedia>
                  <EmptyTitle>Start a conversation</EmptyTitle>
                  <EmptyDescription>
                    A place for the little things worth sharing. This is a local preview; nothing is sent.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
          <CardFooter className="border-t p-3 sm:p-4">
            <VanillaComposer
              text={workspace.draft} onTextChange={workspace.setDraft}
              onSend={workspace.send} companion={workspace.companion}
            />
          </CardFooter>
        </>
      ) : (
        <CardContent className="flex min-h-0 flex-1">
          <Empty className="h-full">
            <EmptyHeader>
              <EmptyMedia variant="icon"><MessageCircleDashedIcon /></EmptyMedia>
              <EmptyTitle>{view}</EmptyTitle>
              <EmptyDescription>This section returns after the shared messaging design is approved.</EmptyDescription>
            </EmptyHeader>
            <Button variant="outline" onClick={() => workspace.navigate("Chats")}>Back to conversations</Button>
          </Empty>
        </CardContent>
      )}
    </Card>
  );
}
