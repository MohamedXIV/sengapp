"use client";

import { useState } from "react";
import { MessageCircleDashedIcon, SquarePenIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./sidebar-08/app-sidebar";
import { conversations, sampleMessages, type MessageData } from "./data";
import { VanillaComposer } from "./composer";
import { VanillaTimeline } from "./timeline";

type View = "Chats" | "People" | "Notes" | "Settings";
type Filter = "All chats" | "Unread" | "Groups";

export function VanillaMessenger() {
  const [view, setView] = useState<View>("Chats");
  const [filter, setFilter] = useState<Filter>("All chats");
  const [selectedId, setSelectedId] = useState("team");
  const [draft, setDraft] = useState("");
  const [threads, setThreads] = useState<Record<string, MessageData[]>>(sampleMessages);
  const conversation = conversations.find(item => item.id === selectedId);
  const title = selectedId === "new" ? "New conversation" : (conversation?.name ?? "Dev Team");
  const subtitle = selectedId === "new" ? "A fresh conversation, just for this preview" : (conversation?.people ?? "");
  const messages = threads[selectedId] ?? [];

  function select(id: string) { setSelectedId(id); setDraft(""); setView("Chats"); }
  function navigate(name: string) {
    if (name === "All chats" || name === "Unread" || name === "Groups") {
      setFilter(name);
      setView("Chats");
    } else if (["Chats", "People", "Notes", "Settings"].includes(name)) {
      setView(name as View);
    }
  }
  function send() {
    const text = draft.trim();
    if (!text) return;
    setThreads(previous => ({
      ...previous,
      [selectedId]: [...(previous[selectedId] ?? []), {
        id: "local-" + Date.now() + "-" + Math.random().toString(36).slice(2),
        sender: "You", time: "Now", text, mine: true,
      }],
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
                      <CardTitle>{title}</CardTitle>
                      <CardDescription>{subtitle}</CardDescription>
                    </div>
                  </div>
                  <Button variant="outline" size="icon" aria-label="New conversation"
                    onClick={() => select("new")}>
                    <SquarePenIcon />
                  </Button>
                </CardHeader>
                <CardContent className="min-h-0 flex-1 p-0">
                  {messages.length > 0 ? (
                    <VanillaTimeline key={selectedId} conversationId={selectedId} messages={messages} />
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
                  <VanillaComposer text={draft} onTextChange={setDraft} onSend={send} />
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
            <span>UI reference based on shadcn's Chat Demo and sidebar-08 block.</span>
            <Badge variant="outline">Demo only</Badge>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
