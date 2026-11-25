"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { isNavigationItemActive } from "@/components/layout/navigation";
import { usePersonalTheme } from "@/components/themes/personal-theme-provider";

export type ChromeNavItem = {
  href: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number; "aria-hidden"?: boolean }>;
  label: string;
};

/**
 * Modular header chrome per skin:
 * - retro: slim Warm Retro OS titlebar strip
 * - glass: Warm Liquid Glass floating pill tabs (crisp white active pill)
 * - paper: Gamey Cozy Almanac die-cut folder tabs (filled active vs. outline icons)
 *
 * Mobile navigation always keeps the accessible SidebarTrigger intact.
 */
export function SkinChrome({
  nav,
  pathname,
  currentTitle,
  openLabel,
  subtitle,
}: {
  nav: ChromeNavItem[];
  pathname: string;
  currentTitle: string;
  openLabel: string;
  subtitle: string;
}) {
  const { windowStyle } = usePersonalTheme();
  const skin = windowStyle.material;

  if (skin === "glass") {
    return (
      <header className="flex shrink-0 items-center justify-between gap-3 px-4 pt-4 md:px-7">
        <div className="flex min-w-0 items-center gap-2.5">
          <SidebarTrigger
            className="size-10 rounded-full border border-border/70 bg-card/70 shadow-sm backdrop-blur-md"
            aria-label={openLabel}
          />
          <span className="truncate text-sm font-semibold md:hidden">{currentTitle}</span>
        </div>
        <nav
          aria-label={currentTitle}
          className="hidden items-center gap-1 rounded-full border border-white/25 bg-card/55 p-1 shadow-sm backdrop-blur-xl md:flex"
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
                    : "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium text-foreground/80 transition-colors hover:bg-card/60 hover:text-foreground"
                }
              >
                <Icon aria-hidden={true} className="size-3.5" strokeWidth={active ? 2.2 : 1.75} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="hidden w-10 md:block" aria-hidden="true" />
      </header>
    );
  }

  if (skin === "paper") {
    return (
      <header className="flex shrink-0 flex-wrap items-end justify-between gap-3 border-b border-dashed border-border/80 bg-card/45 px-4 pt-3 md:px-7">
        <div className="flex items-center gap-2.5 pb-2.5">
          <SidebarTrigger
            className="size-10 rounded-xl border border-border bg-card shadow-xs"
            aria-label={openLabel}
          />
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
                    : "inline-flex items-center gap-1.5 rounded-t-xl border border-b-0 border-border/50 bg-secondary/55 px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-card/80 hover:text-foreground"
                }
              >
                <span
                  aria-hidden="true"
                  className={
                    active
                      ? "flex size-5 items-center justify-center rounded-md bg-primary text-primary-foreground"
                      : "flex size-5 items-center justify-center rounded-md border border-current/35"
                  }
                >
                  <Icon aria-hidden={true} className="size-3" strokeWidth={active ? 2.2 : 1.7} />
                </span>
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </header>
    );
  }

  // Retro OS titlebar strip
  return (
    <header
      className="flex h-12 shrink-0 items-center justify-between gap-3 border-b-[1.5px] border-foreground/75 px-4 md:px-6"
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
