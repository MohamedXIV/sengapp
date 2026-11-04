"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { House, LayoutTemplate } from "lucide-react";
import {
  EXPERIENCE_COOKIE, EXPERIENCE_MAX_AGE,
  classicDestination, cozyDestination, type ExperienceMode,
} from "@/lib/experience";

interface ExperienceSwitchProps {
  to: ExperienceMode;
  panel?: string | null;
  conversationId?: string | null;
  className?: string;
}

/** Full navigation ensures the preference reaches the server before the next render.
 * Classic does not hydrate the Phaser/Dockview route tree. */
export function ExperienceSwitch({ to, panel, conversationId, className }: ExperienceSwitchProps) {
  const pathname = usePathname();
  const t = useTranslations("Experience");
  const href = to === "classic"
    ? classicDestination(panel, conversationId)
    : cozyDestination(pathname);
  const Icon = to === "classic" ? LayoutTemplate : House;
  const label = t(to === "classic" ? "switchToClassic" : "switchToCozy");

  function selectMode() {
    document.cookie = `${EXPERIENCE_COOKIE}=${to}; Max-Age=${EXPERIENCE_MAX_AGE}; Path=/; SameSite=Lax${window.location.protocol === "https:" ? "; Secure" : ""}`;
  }

  return <a href={href} onClick={selectMode}
      data-testid={`switch-to-${to}`} aria-label={label}
      className={className ?? "inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"}>
    <Icon aria-hidden="true" className="size-4 shrink-0" />
    <span>{label}</span>
  </a>;
}
