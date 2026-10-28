"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useClerk } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import { Shield, Settings, MessageSquareHeart, UsersRound, SunMoon, LogOut, Palette } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, SidebarProvider, SidebarTrigger,
} from "@/components/ui/sidebar";
import { PersonalThemeProvider } from "@/components/themes/personal-theme-provider";
import { AccountLocaleProvider } from "@/components/i18n/account-locale-provider";
import { getLocaleDirection, type AppLocale } from "@/lib/i18n/locale";
import type { VisualPreferences } from "@/lib/themes/preferences";

interface AppShellProps {
  children: ReactNode;
  profileId: string;
  visualPreferences?: Partial<VisualPreferences>;
  themePreference: "light" | "dark" | "system";
  userRole?: "operator" | "member";
  displayName?: string;
  handle?: string;
  locale?: AppLocale;
  textDirection?: "ltr" | "rtl" | "auto";
}

export function AppShell(props: AppShellProps) {
  const locale = props.locale ?? "en";
  return (
    <AccountLocaleProvider locale={locale}>
      <PersonalThemeProvider key={props.profileId} profileId={props.profileId}
        preferences={props.visualPreferences} appearance={props.themePreference}>
        <AppShellContent {...props} locale={locale} />
      </PersonalThemeProvider>
    </AccountLocaleProvider>
  );
}

function AppShellContent({
  children, userRole = "member", displayName = "Member", handle = "squirrel", locale = "en",
}: AppShellProps) {
  const { signOut } = useClerk();
  const t = useTranslations("Navigation");
  const common = useTranslations("Common");
  const direction = getLocaleDirection(locale);
  const nav = [
    { href: "/home", icon: MessageSquareHeart, label: t("lounge") },
    { href: "/connections", icon: UsersRound, label: t("connections") },
    { href: "/settings/profile", icon: Settings, label: t("profile") },
    { href: "/settings/profile#appearance", icon: Palette, label: t("appearance") },
    ...(userRole === "operator" ? [{ href: "/admin/invitations", icon: Shield, label: t("operator") }] : []),
  ];

  return (
    <SidebarProvider defaultOpen>
      <div dir={direction} className="flex min-h-screen w-full bg-background text-foreground">
        <Sidebar dir={direction} side={direction === "rtl" ? "right" : "left"} collapsible="offcanvas" aria-label={t("primary")}>
          <SidebarHeader className="gap-3 p-4">
            <Link href="/home" className="flex items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-ring">
              <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-xl text-primary-foreground">🐿️</span>
              <span className="min-w-0">
                <span className="block text-lg font-semibold tracking-tight">Sengapp</span>
                <span className="block text-xs text-muted-foreground">{common("tagline")}</span>
              </span>
            </Link>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {nav.map(({ href, icon: Icon, label }) => <SidebarMenuItem key={href}>
                    <SidebarMenuButton asChild tooltip={label}>
                      <Link href={href}><Icon aria-hidden="true" /> <span>{label}</span></Link>
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
              <Badge variant="secondary">{t(userRole === "operator" ? "operatorRole" : "member")}</Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" asChild>
                <Link href="/settings/profile#appearance"><SunMoon aria-hidden="true" /> {t("appearance")}</Link>
              </Button>
              <Button variant="outline" size="icon" aria-label={t("signOut")}
                onClick={() => void signOut({ redirectUrl: "/login" })}>
                <LogOut aria-hidden="true" />
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="min-w-0">
          <header className="flex h-14 shrink-0 items-center border-b px-4">
            <SidebarTrigger aria-label={t("open")} />
            <span className="ms-3 text-sm text-muted-foreground">Sengapp</span>
          </header>
          <main className="mx-auto w-full max-w-5xl flex-1 space-y-6 p-[var(--sengapp-space,1.5rem)] md:p-10">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
