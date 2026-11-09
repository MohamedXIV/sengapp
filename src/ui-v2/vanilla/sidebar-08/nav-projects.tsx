"use client"

import { useTranslations } from "next-intl"
import {
  Folder,
  MoreHorizontal,
  Share,
  Trash2,
  type LucideIcon,
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function NavProjects({
  projects,
  selectedId,
  onSelect,
}: {
  projects: {
    id: string
    name: string
    url: string
    icon: LucideIcon
  }[]
  selectedId: string
  onSelect: (id: string) => void
}) {
  const t = useTranslations("UiV2");
  const { isMobile, setOpenMobile } = useSidebar()
  function select(id: string) { onSelect(id); setOpenMobile(false) }

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>{t("conversations")}</SidebarGroupLabel>
      <SidebarMenu>
        {projects.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton asChild isActive={selectedId === item.id}>
              <button type="button" onClick={() => select(item.id)}>
                <item.icon />
                <span>{item.name}</span>
              </button>
            </SidebarMenuButton>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction showOnHover>
                  <MoreHorizontal />
                  <span className="sr-only">More</span>
                </SidebarMenuAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-48"
                side={isMobile ? "bottom" : "right"}
                align={isMobile ? "end" : "start"}
              >
                <DropdownMenuItem onSelect={() => select(item.id)}>
                  <Folder className="text-muted-foreground" />
                  <span>{t("openConversation")}</span>
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                  <Share className="text-muted-foreground" />
                  <span>{t("shareLater")}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled>
                  <Trash2 className="text-muted-foreground" />
                  <span>{t("removeLater")}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        ))}
        <SidebarMenuItem>
          <SidebarMenuButton>
            <MoreHorizontal />
            <span>{t("more")}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  )
}
