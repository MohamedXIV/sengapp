"use client";

import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { existingPresenceSessionId } from "@/lib/presence/session";
import { useTranslations } from "next-intl";
import { HeartHandshake, MessageCircle, Palette, Settings2, Shield, UsersRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, SidebarProvider, SidebarRail, useSidebar,
} from "@/components/ui/sidebar";
import { PersonalThemeProvider, usePersonalTheme } from "@/components/themes/personal-theme-provider";
import { AccountLocaleProvider } from "@/components/i18n/account-locale-provider";
import { getLocaleDirection, type AppLocale } from "@/lib/i18n/locale";
import { getNavigationSide, isNavigationItemActive } from "@/components/layout/navigation";
import { SkinChrome, type ChromeNavItem } from "@/components/layout/skin-chrome";
import { CozyMark } from "@/components/brand/cozy-mark";
import { SidebarQuickActions } from "@/components/layout/sidebar-quick-actions";
import { ExperienceSwitch } from "@/components/experience/experience-switch";
import type { VisualPreferences } from "@/lib/themes/preferences";
import type { WindowStyle } from "@/features/cottage/window-style";

interface AppShellProps {
  children: ReactNode;
  profileId: string;
  visualPreferences?: Partial<VisualPreferences>;
  windowStyle?: Partial<WindowStyle> | null;
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
        preferences={props.visualPreferences} windowStyle={props.windowStyle}
        appearance={props.themePreference} reducedMotion={props.reducedMotion}>
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
  items: ChromeNavItem[];
  pathname: string;
}) {
  return <SidebarMenu className="gap-1.5">
    {items.map(({ href, icon: Icon, label }) => <SidebarMenuItem key={href}>
      <SidebarMenuButton asChild size="lg" tooltip={label}
        isActive={isNavigationItemActive(pathname, href)}
        className="min-h-11 rounded-xl px-3 text-[0.9rem] font-medium data-[active=true]:bg-sidebar-accent data-[active=true]:font-semibold data-[active=true]:text-sidebar-accent-foreground data-[active=true]:shadow-xs">
        <SidebarDismissLink href={href}>
          <Icon aria-hidden={true} className="size-5!" strokeWidth={1.8} />
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
  const endSession = useMutation(api.activity.endSession);
  const { windowStyle } = usePersonalTheme();
  const skin = windowStyle.material;

  async function signOutCleanly() {
    const id = existingPresenceSessionId();
    if (id) {
      // An offline client must still be able to sign out promptly.
      await Promise.race([
        endSession({ sessionId: id }).catch(() => {}),
        new Promise<void>(resolve => setTimeout(resolve, 500)),
      ]);
    }
    await signOut({ redirectUrl: "/login" });
  }
  const pathname = usePathname();
  const t = useTranslations("Navigation");
  const common = useTranslations("Common");
  const direction = getLocaleDirection(locale);
  const nav: ChromeNavItem[] = [
    { href: "/classic", icon: HeartHandshake, label: t("lounge") },
    { href: "/connections", icon: UsersRound, label: t("connections") },
    { href: "/chats", icon: MessageCircle, label: t("messages") },
    { href: "/settings/profile", icon: Settings2, label: t("profile") },
    { href: "/settings/appearance", icon: Palette, label: t("appearance") },
    ...(userRole === "operator" ? [{ href: "/admin/invitations", icon: Shield, label: t("operator") }] : []),
  ];
  const currentTitle = nav.find((item) => isNavigationItemActive(pathname, item.href))?.label ?? t("space");
  // Retro keeps the classic side rail open by default; Glass and Paper use
  // top pill/folder-tab navigation inside a framed workspace (sidebar still opens on demand & mobile).
  const defaultSidebarOpen = skin === "retro";

  return (
    <SidebarProvider key={skin} defaultOpen={defaultSidebarOpen} dir={direction} className="sengapp-workspace"
      style={{ "--sidebar-width": "16.5rem" } as CSSProperties}>
      <Sidebar dir={direction} side={getNavigationSide(locale)} variant="floating"
        collapsible="offcanvas" mobileTitle={t("primary")} aria-label={t("primary")}>
        <SidebarHeader className="px-4 pb-2 pt-5">
          <SidebarDismissLink href="/classic" className="flex items-center gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-ring">
            <span aria-hidden="true" className="sengapp-logo flex size-11 shrink-0 items-center justify-center rounded-2xl">
              <CozyMark className="size-11" />
            </span>
            <span className="min-w-0">
              <span className="block text-lg font-extrabold tracking-tight">Sengapp</span>
              <span className="block truncate text-[0.72rem] text-sidebar-foreground/65">{common("tagline")}</span>
            </span>
          </SidebarDismissLink>
        </SidebarHeader>

        <SidebarContent className="px-3 pt-3">
          <SidebarGroup>
            <SidebarGroupLabel className="mb-1.5 px-3 text-[0.68rem] font-semibold tracking-wide text-sidebar-foreground/60">
              {t("space")}
            </SidebarGroupLabel>
            <SidebarGroupContent><SidebarLinks items={nav} pathname={pathname} /></SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="gap-2.5 px-4 pb-4 pt-3">
          <div className="space-y-2.5 rounded-2xl border border-sidebar-border bg-sidebar-accent/45 p-3">
            <div className="flex items-center gap-2.5">
              <span aria-hidden="true" className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-lg">
                🌰
                <span className="absolute -bottom-0.5 -end-0.5 size-2.5 rounded-full border-2 border-sidebar bg-emerald-500" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold" dir="auto">{displayName}</p>
                <p className="truncate text-xs text-sidebar-foreground/65" dir="ltr">@{handle}</p>
              </div>
              <Badge variant="outline" className="shrink-0 border-sidebar-border text-[0.62rem] font-normal">
                {t(userRole === "operator" ? "operatorRole" : "member")}
              </Badge>
            </div>
            <ExperienceSwitch to="cozy" className="flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-sidebar-border bg-card/85 px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-sidebar-ring" />
          </div>
          <SidebarQuickActions locale={locale} onSignOut={() => void signOutCleanly()} />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset className="min-w-0 bg-transparent p-0 md:p-4 lg:p-5">
        <div className="sengapp-shell-frame mx-auto flex min-h-full w-full max-w-6xl flex-1 flex-col">
          <SkinChrome
            nav={nav}
            pathname={pathname}
            currentTitle={currentTitle}
            openLabel={t("open")}
            subtitle={t("topbarSubtitle")}
            displayName={displayName}
          />
          <main className="sengapp-content mx-auto w-full flex-1 space-y-6">
            {children}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
