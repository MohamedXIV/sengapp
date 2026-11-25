"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { isNavigationItemActive } from "@/components/layout/navigation";
import { usePersonalTheme } from "@/components/themes/personal-theme-provider";
import { CozyMark } from "@/components/brand/cozy-mark";
import { ExperienceSwitch } from "@/components/experience/experience-switch";

export type ChromeNavItem = {
  href: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number; "aria-hidden"?: boolean }>;
  label: string;
};

/**
 * Structural skin chrome for Classic Mode:
 * - retro: Warm Retro OS window titlebar with traffic dots and crisp border
 * - glass: Warm Liquid Glass floating pill tabs (crisp white active pill) + quick status chip
 * - paper: Gamey Cozy Almanac die-cut folder tabs (filled active vs. outline inactive icons)
 *
 * Mobile navigation always keeps the accessible SidebarTrigger intact.
 */
export function SkinChrome({
  nav,
  pathname,
  currentTitle,
  openLabel,
  subtitle,
  displayName,
}: {
  nav: ChromeNavItem[];
  pathname: string;
  currentTitle: string;
  openLabel: string;
  subtitle: string;
  displayName: string;
}) {
  const { windowStyle } = usePersonalTheme();
  const skin = windowStyle.material;

  if (skin === "glass") {
    return (
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/15 px-4 py-3 md:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <SidebarTrigger
            className="size-9 rounded-full border border-white/25 bg-card/55 shadow-xs backdrop-blur-md"
            aria-label={openLabel}
          />
          <Link href="/classic" className="hidden items-center gap-2 md:flex">
            <CozyMark className="size-7" />
            <span className="text-sm font-extrabold tracking-tight">Sengapp</span>
          </Link>
          <span className="truncate text-sm font-semibold md:hidden">{currentTitle}</span>
        </div>

        <nav
          aria-label={currentTitle}
          className="hidden items-center gap-1 rounded-full border border-white/25 bg-card/45 p-1 shadow-xs backdrop-blur-xl md:flex"
        >
          {nav.map(({ href, icon: Icon, label }) => {
            const active = isNavigationItemActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={
                  active
                    ? "inline-flex items-center gap-1.5 rounded-full bg-[var(--skin-pill-active-bg,#fff)] px-4 py-1.5 text-xs font-bold text-[var(--skin-pill-active-fg,#2d2219)] shadow-sm transition-all"
                    : "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium text-foreground/80 transition-colors hover:bg-card/55 hover:text-foreground"
                }
              >
                <Icon aria-hidden={true} className="size-3.5" strokeWidth={active ? 2.2 : 1.75} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <ExperienceSwitch
            to="cozy"
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-white/25 bg-card/55 px-3 text-xs font-semibold text-foreground transition-colors hover:bg-card/80"
          />
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-card/45 px-2.5 py-1 text-xs font-medium">
            <span className="size-2 rounded-full bg-emerald-500" aria-hidden="true" />
            <span className="max-w-24 truncate" dir="auto">{displayName}</span>
          </span>
        </div>
      </header>
    );
  }

  if (skin === "paper") {
    return (
      <header className="flex shrink-0 flex-wrap items-end justify-between gap-3 border-b border-dashed border-border bg-secondary/40 px-4 pt-3 md:px-6">
        <div className="flex items-center gap-2.5 pb-2.5">
          <SidebarTrigger
            className="size-9 rounded-xl border border-border bg-card shadow-xs"
            aria-label={openLabel}
          />
          <Link href="/classic" className="hidden items-center gap-2 md:flex">
            <CozyMark className="size-7" />
            <span className="text-sm font-extrabold tracking-tight">Sengapp</span>
          </Link>
          <div className="min-w-0 md:hidden">
            <p className="truncate text-sm font-semibold">{currentTitle}</p>
            <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>

        <nav aria-label={currentTitle} className="hidden items-end gap-1.5 md:flex">
          {nav.map(({ href, icon: Icon, label }) => {
            const active = isNavigationItemActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={
                  active
                    ? "relative -mb-px inline-flex items-center gap-2 rounded-t-xl border border-b-0 border-border bg-card px-4 py-2 text-xs font-bold text-foreground shadow-xs"
                    : "inline-flex items-center gap-1.5 rounded-t-xl border border-b-0 border-border/55 bg-secondary/70 px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-card/80 hover:text-foreground"
                }
              >
                <span
                  aria-hidden="true"
                  className={
                    active
                      ? "flex size-5 items-center justify-center rounded-md bg-primary text-primary-foreground"
                      : "flex size-5 items-center justify-center rounded-md border border-current/40"
                  }
                >
                  <Icon aria-hidden={true} className="size-3" strokeWidth={active ? 2.2 : 1.7} />
                </span>
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="hidden pb-2 md:flex">
          <ExperienceSwitch
            to="cozy"
            className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-dashed border-border bg-card px-3 text-xs font-semibold text-foreground transition-colors hover:bg-accent"
          />
        </div>
      </header>
    );
  }

  // Retro OS titlebar strip
  return (
    <header
      className="flex h-12 shrink-0 items-center justify-between gap-3 border-b-[1.5px] border-foreground/75 px-4 md:px-5"
      style={{ background: "var(--skin-header-bg)" }}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <SidebarTrigger
          className="size-8 rounded-lg border-[1.5px] border-foreground/75 bg-card shadow-[2px_2px_0_hsl(var(--foreground)/0.75)]"
          aria-label={openLabel}
        />
        <p className="truncate text-sm font-extrabold tracking-tight">{currentTitle}</p>
      </div>
      <div className="hidden items-center gap-1.5 sm:flex" aria-hidden="true">
        <span className="size-2.5 rounded-full border border-foreground/75 bg-card" />
        <span className="size-2.5 rounded-full border border-foreground/75 bg-card" />
        <span className="size-2.5 rounded-full border border-foreground/75 bg-primary" />
      </div>
    </header>
  );
}
