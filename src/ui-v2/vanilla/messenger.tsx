"use client";

import { useState, type FormEvent } from "react";
import { BotIcon, MessageCircleDashedIcon, SquarePenIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./sidebar-08/app-sidebar";
import { conversations, exampleAgentConsent, sampleCompanionActivity, sampleMessages, type MessageData, type PreviewCompanion } from "./data";
import type { PreviewDecision } from "./agent-activity";
import { VanillaComposer } from "./composer";
import { VanillaTimeline } from "./timeline";

type View = "Chats" | "People" | "Notes" | "Settings";
type Filter = "All chats" | "Unread" | "Groups";

export function VanillaMessenger() {
  const [view, setView] = useState<View>("Chats");
  const [filter, setFilter] = useState<Filter>("All chats");
  const [selectedId, setSelectedId] = useState("team");
  const [draft, setDraft] = useState("");
  const [companion, setCompanion] = useState<PreviewCompanion | null>(null);
  const [setupOpen, setSetupOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [handleDraft, setHandleDraft] = useState("");
  const [threads, setThreads] = useState<Record<string, MessageData[]>>(sampleMessages);
  const [decisions, setDecisions] = useState<Record<string, PreviewDecision>>({});
  const conversation = conversations.find(item => item.id === selectedId);
  const title = selectedId === "new" ? "New conversation" : (conversation?.name ?? "Dev Team");
  const subtitle = selectedId === "new" ? "A fresh conversation, just for this preview" : (conversation?.people ?? "");
  const messages = threads[selectedId] ?? [];

  function saveCompanion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = nameDraft.trim();
    const handle = handleDraft.trim().toLowerCase();
    if (!name || name.length > 40 || !/^[a-z][a-z0-9_]{1,23}$/.test(handle)) return;
    setCompanion({ name, handle });
    setThreads(previous => {
      const next = Object.fromEntries(Object.entries(previous).map(([id, rows]) => [
        id, rows.map(row => row.kind === "agent" ? { ...row, sender: name } : row),
      ])) as Record<string, MessageData[]>;
      if (!(next.team ?? []).some(row => row.id === sampleCompanionActivity.id)) {
        next.team = [...(next.team ?? []), { ...sampleCompanionActivity, sender: name }];
      }
      return next;
    });
    setSetupOpen(false);
  }

  function select(id: string) { setSelectedId(id); setDraft(""); setView("Chats"); }
  function navigate(name: string) {
    if (name === "All chats" || name === "Unread" || name === "Groups") {
      setFilter(name);
      setView("Chats");
    } else if (["Chats", "People", "Notes", "Settings"].includes(name)) {
      setView(name as View);
    }
  }
  // UI-only: a mention is available in every thread. It never calls an AI model or
  // sends conversation context to a provider. Real consent is a server-side gate.
  function send() {
    const text = draft.trim();
    if (!text) return;
    const id = "local-" + Date.now() + "-" + Math.random().toString(36).slice(2);
    const additions: MessageData[] = [
      { id, sender: "You", time: "Now", text, mine: true },
    ];
    const mentioned = companion !== null && new RegExp("(?:^|\\s)@" + companion.handle + "(?=$|\\s|[,.!?])", "i").test(text);
    if (mentioned && companion && exampleAgentConsent[selectedId]) {
      additions.push({
        id: id + "-companion", sender: companion.name, kind: "agent",
        time: "Now", text: "Local UI example: I can be addressed in this thread. No AI model, memory, connected app or tool has been called.",
        parts: [
          { type: "tool", title: "Awaiting a permissioned AI backend", status: "pending" },
        ],
      });
    } else if (mentioned) {
      additions.push({
        id: id + "-permission", sender: "System", kind: "notice", time: "Now",
        text: "Companion request not activated. Every participant must explicitly consent before an agent can receive context here. Nothing was sent to a provider.",
      });
    }
    setThreads(previous => ({
      ...previous,
      [selectedId]: [...(previous[selectedId] ?? []), ...additions],
    }));
    setDraft("");
  }

  return (
    <SidebarProvider data-sengapp-shadcn-blocks>
      <AppSidebar selectedId={selectedId} onChooseConversation={select} onNavigate={navigate} filter={filter} />
      <SidebarInset className="h-dvh min-h-0 overflow-hidden">
        <header className="flex h-16 shrink-0 items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" aria-label="Toggle Sidebar" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb><BreadcrumbList><BreadcrumbItem>
            <BreadcrumbPage>Sengapp / {view}</BreadcrumbPage>
          </BreadcrumbItem></BreadcrumbList></Breadcrumb>
        </header>
        <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 pt-0">
          <Card className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col gap-0 overflow-hidden">
            {view === "Chats" ? (
              <>
                <CardHeader className="flex-row items-center justify-between gap-4 border-b">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar><AvatarFallback>{conversation?.initials ?? "✳"}</AvatarFallback></Avatar>
                    <div className="min-w-0">
                      <CardTitle role="heading" aria-level={1}>{title}</CardTitle>
                      <CardDescription>{subtitle}</CardDescription>
                      <Badge variant="outline" className="mt-1">
                        <BotIcon className="me-1 size-3" />
                        {!companion ? "Choose your own companion alias" : exampleAgentConsent[selectedId] ? `@${companion.handle} · sample consent` : `@${companion.handle} · consent required`}
                      </Badge>
                    </div>
                  </div>
                  <Dialog open={setupOpen} onOpenChange={setSetupOpen}>
                    <DialogTrigger asChild>
                      <Button type="button" variant="outline" size="sm" onClick={() => {
                        setNameDraft(companion?.name ?? "");
                        setHandleDraft(companion?.handle ?? "");
                      }}>
                        <BotIcon className="size-4" />
                        {companion ? "Edit companion" : "Name your companion"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <form onSubmit={saveCompanion} className="space-y-4">
                        <DialogHeader>
                          <DialogTitle>Choose your companion&apos;s identity</DialogTitle>
                          <DialogDescription>
                            You choose the display name and @mention alias. No default agent name.
                            This is local demo state, not an account setting.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-2">
                          <Label htmlFor="companion-display-name">Companion display name</Label>
                          <Input id="companion-display-name" maxLength={40} required
                            placeholder="Any name, including Arabic"
                            value={nameDraft} onChange={event => setNameDraft(event.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="companion-mention-alias">Mention alias</Label>
                          <Input id="companion-mention-alias" maxLength={24} minLength={2} required
                            pattern="[a-zA-Z][a-zA-Z0-9_]{1,23}"
                            placeholder="e.g. star_helper" autoCapitalize="none" spellCheck={false}
                            value={handleDraft} onChange={event => setHandleDraft(event.target.value)} />
                          <p className="text-xs text-muted-foreground">
                            Used as @alias; Latin letters, digits and underscores, 2–24 characters.
                          </p>
                        </div>
                        <DialogFooter><Button type="submit">Save companion</Button></DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                  <Button variant="outline" size="icon" aria-label="New conversation"
                    onClick={() => select("new")}>
                    <SquarePenIcon />
                  </Button>
                </CardHeader>
                <CardContent className="min-h-0 flex-1 p-0">
                  {messages.length > 0 ? (
                    <VanillaTimeline key={selectedId} conversationId={selectedId} messages={messages}
                      decisions={decisions} onDecision={(key, decision) =>
                        setDecisions(previous => ({ ...previous, [key]: decision }))
                      } />
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
                <CardFooter className="border-t p-4">
                  <VanillaComposer text={draft} onTextChange={setDraft} onSend={send} companion={companion} />
                </CardFooter>
              </>
            ) : (
              <CardContent className="flex min-h-0 flex-1">
                <Empty className="h-full">
                  <EmptyHeader>
                    <EmptyMedia variant="icon"><MessageCircleDashedIcon /></EmptyMedia>
                    <EmptyTitle>{view}</EmptyTitle>
                    <EmptyDescription>This section returns after the core messaging design is approved.</EmptyDescription>
                  </EmptyHeader>
                  <Button variant="outline" onClick={() => setView("Chats")}>Back to conversations</Button>
                </Empty>
              </CardContent>
            )}
          </Card>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>UI reference based on shadcn&apos;s Chat Demo and sidebar-08 block.</span>
            <Badge variant="outline">Demo only</Badge>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
