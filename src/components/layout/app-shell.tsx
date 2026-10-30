"use client";

import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import { HeartHandshake, MessageCircle, Palette, Settings2, Shield, UsersRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, SidebarProvider, SidebarRail, SidebarTrigger, useSidebar,
} from "@/components/ui/sidebar";
import { PersonalThemeProvider } from "@/components/themes/personal-theme-provider";
import { AccountLocaleProvider } from "@/components/i18n/account-locale-provider";
import { getLocaleDirection, type AppLocale } from "@/lib/i18n/locale";
import { getNavigationSide, isNavigationItemActive } from "@/components/layout/navigation";
import { CozyMark } from "@/components/brand/cozy-mark";
import { SidebarQuickActions } from "@/components/layout/sidebar-quick-actions";
import type { VisualPreferences } from "@/lib/themes/preferences";

interface AppShellProps {
  children: ReactNode;
  profileId: string;
  visualPreferences?: Partial<VisualPreferences>;
  themePreference: "light" | "dark" | "system";
  reducedMotion?: boolean;
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
        preferences={props.visualPreferences} appearance={props.themePreference} reducedMotion={props.reducedMotion}>
        <AppShellContent {...props} locale={locale} />
      </PersonalThemeProvider>
    </AccountLocaleProvider>
  );
}

export function SidebarDismissLink({ href, children, className }: {
  href: string; children: ReactNode; className?: string;
}) {
  const { isMobile, setOpenMobile } = useSidebar();
  return <Link href={href} className={className}
    onClick={() => { if (isMobile) setOpenMobile(false); }}>{children}</Link>;
}

function SidebarLinks({ items, pathname }: {
  items: Array<{ href: string; icon: typeof HeartHandshake; label: string }>;
  pathname: string;
}) {
  return <SidebarMenu className="gap-1.5">
    {items.map(({ href, icon: Icon, label }) => <SidebarMenuItem key={href}>
      <SidebarMenuButton asChild size="lg" tooltip={label}
        isActive={isNavigationItemActive(pathname, href)}
        className="min-h-12 rounded-xl px-3 text-[0.925rem] font-medium data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[active=true]:shadow-sm">
        <SidebarDismissLink href={href}>
          <Icon aria-hidden="true" className="size-5!" strokeWidth={1.8} />
          <span>{label}</span>
        </SidebarDismissLink>
      </SidebarMenuButton>
    </SidebarMenuItem>)}
  </SidebarMenu>;
}

function AppShellContent({
  children, userRole = "member", displayName = "Member", handle = "squirrel", locale = "en",
}: AppShellProps) {
  const { signOut } = useClerk();
  const pathname = usePathname();
  const t = useTranslations("Navigation");
  const common = useTranslations("Common");
  const direction = getLocaleDirection(locale);
  const nav = [
    { href: "/home", icon: HeartHandshake, label: t("lounge") },
    { href: "/connections", icon: UsersRound, label: t("connections") },
    { href: "/chats", icon: MessageCircle, label: t("messages") },
    { href: "/settings/profile", icon: Settings2, label: t("profile") },
    { href: "/settings/appearance", icon: Palette, label: t("appearance") },
    ...(userRole === "operator" ? [{ href: "/admin/invitations", icon: Shield, label: t("operator") }] : []),
  ];
  const currentTitle = nav.find((item) => isNavigationItemActive(pathname, item.href))?.label ?? t("space");

  return (
    <SidebarProvider defaultOpen dir={direction} className="sengapp-workspace"
      style={{ "--sidebar-width": "17.5rem" } as CSSProperties}>
      <Sidebar dir={direction} side={getNavigationSide(locale)} variant="floating"
        collapsible="offcanvas" mobileTitle={t("primary")} aria-label={t("primary")}>
        <SidebarHeader className="px-5 pb-3 pt-6">
          <SidebarDismissLink href="/home" className="flex items-center gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-ring">
            <span aria-hidden="true" className="sengapp-logo flex size-12 shrink-0 items-center justify-center rounded-2xl">
              <CozyMark className="size-12" />
            </span>
            <span className="min-w-0">
              <span className="block text-xl font-extrabold tracking-tight">Sengapp</span>
              <span className="block text-xs leading-relaxed text-sidebar-foreground/65">{common("tagline")}</span>
            </span>
          </SidebarDismissLink>
        </SidebarHeader>

        <SidebarContent className="px-3 pt-4">
          <SidebarGroup>
            <SidebarGroupLabel className="mb-2 px-3 text-[0.7rem] font-semibold tracking-wide text-sidebar-foreground/60">
              {t("space")}
            </SidebarGroupLabel>
            <SidebarGroupContent><SidebarLinks items={nav} pathname={pathname} /></SidebarGroupContent>
          </SidebarGroup>
          <div className="sengapp-sidebar-note mx-3 mt-auto space-y-2 rounded-2xl border border-sidebar-border p-4">
            <span aria-hidden="true" className="text-xl">✿</span>
            <p className="text-sm font-semibold leading-relaxed">{t("noteTitle")}</p>
            <p className="text-xs leading-5 text-sidebar-foreground/75">{t("noteDescription")}</p>
            <Button asChild size="sm" variant="secondary" className="mt-2 w-full rounded-xl">
              <SidebarDismissLink href="/connections">{t("inviteAction")}</SidebarDismissLink>
            </Button>
          </div>
        </SidebarContent>

        <SidebarFooter className="gap-3 px-5 pb-5 pt-4">
          <div className="rounded-2xl border border-sidebar-border bg-sidebar-accent/50 p-3">
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xl">🌰</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold" dir="auto">{displayName}</p>
                <p className="truncate text-xs text-sidebar-foreground/65" dir="ltr">@{handle}</p>
              </div>
              <Badge variant="outline" className="shrink-0 border-sidebar-border text-[0.65rem] font-normal">
                {t(userRole === "operator" ? "operatorRole" : "member")}
              </Badge>
            </div>
          </div>
          <SidebarQuickActions locale={locale} onSignOut={() => void signOut({ redirectUrl: "/login" })} />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset className="min-w-0 bg-transparent">
        <header className="sengapp-topbar flex h-[4.5rem] shrink-0 items-center gap-3 px-4 md:px-7">
          <SidebarTrigger className="size-10 rounded-xl border border-border/80 bg-card/75 shadow-sm"
            aria-label={t("open")} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{currentTitle}</p>
            <p className="hidden truncate text-xs text-muted-foreground sm:block">{t("topbarSubtitle")}</p>
          </div>
          <span className="sengapp-topbar-bloom" aria-hidden="true">✳</span>
        </header>
        <main className="sengapp-content mx-auto w-full max-w-6xl flex-1 space-y-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
