"use client";

import { Archive, ChevronRight, ChevronsUpDown, Hash, Info, Leaf, MessageCircle, Palette, UsersRound } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarHeader, SidebarMenu, SidebarMenuAction, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub,
  SidebarMenuSubButton, SidebarMenuSubItem, SidebarRail, useSidebar } from "@/components/ui/sidebar";

type Section = "chats" | "people" | "notes";
type Filter = "all" | "unread" | "groups";

export function SengappAppSidebar({ section, filter, selectedId, onSection, onFilter, onSelect, onAppearance, onAbout }: {
  section: Section; filter: Filter; selectedId: string;
  onSection: (value: Section) => void; onFilter: (value: Filter) => void;
  onSelect: (id: string) => void; onAppearance: () => void; onAbout: () => void;
}) {
  const { isMobile, setOpenMobile } = useSidebar();
  function selectSection(value: Section) { onSection(value); setOpenMobile(false); }
  function selectFilter(value: Filter) { onFilter(value); onSection("chats"); setOpenMobile(false); }
  function selectChat(value: string) { onSelect(value); setOpenMobile(false); }
  return <Sidebar variant="inset" collapsible="offcanvas" mobileTitle="Sengapp navigation">
    <SidebarHeader>
      <SidebarMenu><SidebarMenuItem>
        <SidebarMenuButton type="button" size="lg" onClick={() => selectSection("chats")}>
          <span className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"><Leaf className="size-4" aria-hidden="true"/></span>
          <span className="grid flex-1 text-left text-sm leading-tight"><span className="truncate font-semibold">Sengapp</span><span className="truncate text-xs">A little closer</span></span>
        </SidebarMenuButton>
      </SidebarMenuItem></SidebarMenu>
    </SidebarHeader>
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>Your space</SidebarGroupLabel>
        <SidebarMenu>
          <Collapsible asChild defaultOpen>
            <SidebarMenuItem>
              <SidebarMenuButton type="button" tooltip="Chats" isActive={section === "chats"} onClick={() => selectSection("chats")}>
                <MessageCircle aria-hidden="true"/><span>Chats</span>
              </SidebarMenuButton>
              <CollapsibleTrigger asChild>
                <SidebarMenuAction type="button" aria-label="Toggle chat filters" className="data-[state=open]:rotate-90">
                  <ChevronRight aria-hidden="true"/>
                </SidebarMenuAction>
              </CollapsibleTrigger>
              <CollapsibleContent><SidebarMenuSub>
                {([["all","All chats"],["unread","Unread"],["groups","Groups"]] as const).map(([value,label]) =>
                  <SidebarMenuSubItem key={value}>
                    <SidebarMenuSubButton asChild isActive={section === "chats" && filter === value}>
                      <button type="button" onClick={() => selectFilter(value)}>{label}</button>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                )}
              </SidebarMenuSub></CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
          <SidebarMenuItem><SidebarMenuButton type="button" tooltip="People" isActive={section === "people"} onClick={() => selectSection("people")}>
            <UsersRound aria-hidden="true"/><span>People</span>
          </SidebarMenuButton></SidebarMenuItem>
          <SidebarMenuItem><SidebarMenuButton type="button" tooltip="Notes" isActive={section === "notes"} onClick={() => selectSection("notes")}>
            <Archive aria-hidden="true"/><span>Notes</span>
          </SidebarMenuButton></SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
      <SidebarGroup><SidebarGroupLabel>Pinned chats</SidebarGroupLabel><SidebarMenu>
        {[{id:"dev-team",name:"Dev Team"},{id:"garden",name:"The Garden"}].map(item =>
          <SidebarMenuItem key={item.id}>
            <SidebarMenuButton type="button" tooltip={item.name} isActive={selectedId === item.id} onClick={() => selectChat(item.id)}>
              <Hash aria-hidden="true"/><span>{item.name}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>)}
      </SidebarMenu></SidebarGroup>
      <SidebarGroup className="mt-auto"><SidebarGroupContent><SidebarMenu>
        <SidebarMenuItem><SidebarMenuButton type="button" size="sm" onClick={() => { setOpenMobile(false); onAppearance(); }}>
          <Palette aria-hidden="true"/><span>Appearance</span>
        </SidebarMenuButton></SidebarMenuItem>
        <SidebarMenuItem><SidebarMenuButton type="button" size="sm" onClick={() => { setOpenMobile(false); onAbout(); }}>
          <Info aria-hidden="true"/><span>About this demo</span>
        </SidebarMenuButton></SidebarMenuItem>
      </SidebarMenu></SidebarGroupContent></SidebarGroup>
    </SidebarContent>
    <SidebarFooter><SidebarMenu><SidebarMenuItem>
      <DropdownMenu><DropdownMenuTrigger asChild>
        <SidebarMenuButton type="button" size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
          <Avatar className="size-8 rounded-lg"><AvatarFallback className="rounded-lg">Y</AvatarFallback></Avatar>
          <span className="grid flex-1 text-left text-sm leading-tight"><span className="truncate font-medium">Your space</span><span className="truncate text-xs">Design preview</span></span>
          <ChevronsUpDown className="ms-auto size-4" aria-hidden="true"/>
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg" side={isMobile?"bottom":"right"} align="end" sideOffset={4}>
        <DropdownMenuLabel className="font-normal">Sengapp UI v2 · local demo</DropdownMenuLabel>
        <DropdownMenuSeparator/>
        <DropdownMenuItem onSelect={() => { setOpenMobile(false); onAppearance(); }}><Palette aria-hidden="true"/>Appearance</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => { setOpenMobile(false); onAbout(); }}><Info aria-hidden="true"/>About this demo</DropdownMenuItem>
      </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem></SidebarMenu></SidebarFooter>
    <SidebarRail/>
  </Sidebar>;
}
