"use client"

import { ChevronRight, type LucideIcon } from "lucide-react"
import { useTranslations } from "next-intl"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
  onNavigate,
}: {
  items: {
    title: string
    label: string
    url: string
    icon: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      label: string
      url: string
    }[]
  }[]
  onNavigate: (name: string) => void
}) {
  const t = useTranslations("UiV2");
  const { setOpenMobile } = useSidebar()
  function navigate(name: string) {
    onNavigate(name)
    setOpenMobile(false)
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{t("yourSpace")}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible key={item.title} asChild defaultOpen={item.isActive}>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={item.label}>
                <button type="button" onClick={() => navigate(item.title)}>
                  <item.icon />
                  <span>{item.label}</span>
                </button>
              </SidebarMenuButton>
              {item.items?.length ? (
                <>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuAction className="data-[state=open]:rotate-90">
                      <ChevronRight />
                      <span className="sr-only">Toggle</span>
                    </SidebarMenuAction>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild>
                            <button type="button" onClick={() => navigate(subItem.title)}>
                              <span>{subItem.label}</span>
                            </button>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </>
              ) : null}
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
