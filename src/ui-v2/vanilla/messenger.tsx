"use client";

import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel,
  SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuBadge, SidebarMenuButton,
  SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar,
} from "@/components/ui/sidebar";
import { conversations, sampleMessages, type MessageData } from "./data";
import { VanillaComposer } from "./composer";
import { VanillaTimeline } from "./timeline";

function ChatNavigation({ selectedId, onSelect }: {
  selectedId: string; onSelect: (id: string) => void;
}) {
  const { setOpenMobile } = useSidebar();
  return (
    <Sidebar variant="inset" collapsible="offcanvas">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <Avatar><AvatarFallback>S</AvatarFallback></Avatar>
              <span>Sengapp</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Chats</SidebarGroupLabel>
          <SidebarMenu>
            {conversations.map(conversation => (
              <SidebarMenuItem key={conversation.id}>
                <SidebarMenuButton
                  type="button"
                  isActive={selectedId === conversation.id}
                  onClick={() => { onSelect(conversation.id); setOpenMobile(false); }}
                >
                  <span>{conversation.name}</span>
                </SidebarMenuButton>
                {conversation.unread > 0 && <SidebarMenuBadge>{conversation.unread}</SidebarMenuBadge>}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter><p>Sample conversations only</p></SidebarFooter>
    </Sidebar>
  );
}

export function VanillaMessenger() {
  const [selectedId, setSelectedId] = useState("team");
  const [draft, setDraft] = useState("");
  const [threads, setThreads] = useState<Record<string, MessageData[]>>(sampleMessages);
  const conversation = conversations.find(item => item.id === selectedId) ?? conversations[0]!;
  const messages = threads[conversation.id] ?? [];

  function send() {
    const value = draft.trim();
    if (!value) return;
    const message: MessageData = {
      id: "local-" + Date.now() + "-" + Math.random().toString(36).slice(2),
      sender: "You", time: "Now", text: value, mine: true,
    };
    setThreads(previous => ({
      ...previous,
      [conversation.id]: [...(previous[conversation.id] ?? []), message],
    }));
    setDraft("");
  }

  return (
    <SidebarProvider>
      <ChatNavigation selectedId={selectedId} onSelect={id => { setSelectedId(id); setDraft(""); }} />
      <SidebarInset className="h-dvh min-h-0 overflow-hidden">
        <header className="flex shrink-0 items-center gap-2 p-4">
          <SidebarTrigger />
          <Separator orientation="vertical" />
          <Avatar><AvatarFallback>{conversation.initials}</AvatarFallback></Avatar>
          <div>
            <h1>{conversation.name}</h1>
            <p>{conversation.people}</p>
          </div>
          <Badge variant="outline">shadcn defaults</Badge>
        </header>
        <Separator />
        <main className="flex min-h-0 flex-1 flex-col" aria-label={"Conversation with " + conversation.name}>
          <div className="min-h-0 flex-1">
            <VanillaTimeline conversationId={conversation.id} messages={messages} />
          </div>
          <Separator />
          <div className="p-4"><VanillaComposer text={draft} onTextChange={setDraft} onSend={send} /></div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
