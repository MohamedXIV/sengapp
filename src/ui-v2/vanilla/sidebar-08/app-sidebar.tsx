"use client"

import * as React from "react"
import { Command, LifeBuoy, MessageCircle, MessageSquare, NotebookTabs, Send, Settings2, Users } from "lucide-react"

import { NavMain } from "./nav-main"
import { NavProjects } from "./nav-projects"
import { NavSecondary } from "./nav-secondary"
import { NavUser } from "./nav-user"
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from "@/components/ui/sidebar"
import { conversations } from "../data"

export function AppSidebar({ selectedId, onSelect, onNavigate, filter, ...props }: React.ComponentProps<typeof Sidebar> & {
  selectedId: string
  onSelect: (id: string) => void
  onNavigate: (name: string) => void
  filter: "All chats" | "Unread" | "Groups"
}) {
  const data = {
    user: { name: "Your space", email: "Sengapp UI v2 preview", avatar: "" },
    navMain: [
      { title: "Chats", url: "#", icon: MessageCircle, isActive: true, items: [
        { title: "All chats", url: "#" },
        { title: "Unread", url: "#" },
        { title: "Groups", url: "#" },
      ] },
      { title: "People", url: "#", icon: Users },
      { title: "Notes", url: "#", icon: NotebookTabs },
      { title: "Settings", url: "#", icon: Settings2 },
    ],
    navSecondary: [
      { title: "Support", url: "https://github.com/MohamedXIV/sengapp", icon: LifeBuoy },
      { title: "Feedback", url: "https://github.com/MohamedXIV/sengapp/issues", icon: Send },
    ],
    projects: conversations.filter(conversation => filter === "Unread" ? conversation.unread > 0 : filter === "Groups" ? conversation.id !== "sara" : true).map(conversation => ({
      id: conversation.id,
      name: conversation.name,
      url: "#",
      icon: MessageSquare,
    })),
  }

  return (
    <Sidebar variant="inset" collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <button type="button" onClick={() => onNavigate("Chats")}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Sengapp</span>
                  <span className="truncate text-xs">A little closer</span>
                </div>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} onNavigate={onNavigate} />
        <NavProjects projects={data.projects} selectedId={selectedId} onSelect={onSelect} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter><NavUser user={data.user} /></SidebarFooter>
    </Sidebar>
  )
}
