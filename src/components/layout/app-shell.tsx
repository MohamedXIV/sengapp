"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useClerk } from "@clerk/nextjs";
import { Shield, Settings, MessageSquareHeart, UsersRound, SunMoon, LogOut, Palette } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, SidebarProvider, SidebarTrigger,
} from "@/components/ui/sidebar";
import { PersonalThemeProvider } from "@/components/themes/personal-theme-provider";
import type { VisualPreferences } from "@/lib/themes/preferences";

interface AppShellProps {
  children: ReactNode;
  profileId: string;
  visualPreferences?: Partial<VisualPreferences>;
  themePreference: "light" | "dark" | "system";
  userRole?: "operator" | "member";
  displayName?: string;
  handle?: string;
  locale?: "en" | "ar";
  textDirection?: "ltr" | "rtl" | "auto";
}

export function AppShell({
  children, profileId, visualPreferences, themePreference,
  userRole = "member", displayName = "Member", handle = "squirrel",
  locale = "en", textDirection = "auto",
}: AppShellProps) {
  const { signOut } = useClerk();
  const resolvedDir = textDirection === "auto" ? (locale === "ar" ? "rtl" : "ltr") : textDirection;

  const nav = [
    { href: "/home", icon: MessageSquareHeart, en: "Cozy Lounge", ar: "الردهة الخاصة" },
    { href: "/connections", icon: UsersRound, en: "Connections", ar: "جهات الاتصال" },
    { href: "/settings/profile", icon: Settings, en: "Profile & Privacy", ar: "الملف الشخصي والخصوصية" },
    { href: "/settings/profile#appearance", icon: Palette, en: "Appearance", ar: "المظهر" },
    ...(userRole === "operator" ? [{ href: "/admin/invitations", icon: Shield, en: "Operator Tools", ar: "أدوات الإدارة" }] : []),
  ];

  return (
    <PersonalThemeProvider key={profileId} profileId={profileId} preferences={visualPreferences} appearance={themePreference}>
      <SidebarProvider defaultOpen>
        <div dir={resolvedDir} className="flex min-h-screen w-full bg-background text-foreground">
          <Sidebar side={resolvedDir === "rtl" ? "right" : "left"} collapsible="offcanvas" aria-label="Primary Navigation">
            <SidebarHeader className="gap-3 p-4">
              <Link href="/home" className="flex items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-ring">
                <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-xl text-primary-foreground">🐿️</span>
                <span className="min-w-0">
                  <span className="block text-lg font-semibold tracking-tight">Sengapp</span>
                  <span className="block text-xs text-muted-foreground">
                    {locale === "ar" ? "مكان صغير لحوارات كبيرة" : "A little place for big conversations"}
                  </span>
                </span>
              </Link>
            </SidebarHeader>

            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {nav.map(({ href, icon: Icon, en, ar }) => <SidebarMenuItem key={href}>
                      <SidebarMenuButton asChild tooltip={locale === "ar" ? ar : en}>
                        <Link href={href}><Icon aria-hidden="true" /> <span>{locale === "ar" ? ar : en}</span></Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>)}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="border-t p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold" dir="auto">{displayName}</p>
                  <p className="truncate text-xs text-muted-foreground" dir="ltr">@{handle}</p>
                </div>
                <Badge variant="secondary">{userRole}</Badge>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" asChild>
                  <Link href="/settings/profile#appearance"><SunMoon aria-hidden="true" /> {locale === "ar" ? "المظهر" : "Appearance"}</Link>
                </Button>
                <Button variant="outline" size="icon" aria-label="Sign out" onClick={() => void signOut({ redirectUrl: "/login" })}>
                  <LogOut aria-hidden="true" />
                </Button>
              </div>
            </SidebarFooter>
          </Sidebar>

          <SidebarInset className="min-w-0">
            <header className="flex h-14 shrink-0 items-center border-b px-4">
              <SidebarTrigger aria-label="Open navigation" />
              <span className="ms-3 text-sm text-muted-foreground">Sengapp</span>
            </header>
            <main className="mx-auto w-full max-w-5xl flex-1 space-y-6 p-[var(--sengapp-space,1.5rem)] md:p-10">{children}</main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </PersonalThemeProvider>
  );
}
