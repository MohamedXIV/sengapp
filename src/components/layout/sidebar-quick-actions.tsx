"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { Languages, LogOut, Moon, Settings, Sun } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSidebar } from "@/components/ui/sidebar";
import type { AppLocale } from "@/lib/i18n/locale";

export function SidebarQuickActions({ locale, onSignOut }: {
  locale: AppLocale;
  onSignOut: () => void;
}) {
  const t = useTranslations("Navigation");
  const update = useMutation(api.profiles.updateUiShortcuts);
  const { resolvedTheme, theme, setTheme } = useTheme();
  const { isMobile, setOpenMobile } = useSidebar();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const nextLocale = locale === "ar" ? "en" : "ar";
  const nextMode = resolvedTheme === "dark" ? "light" : "dark";
  const languageLabel = t(nextLocale === "ar" ? "switchToArabic" : "switchToEnglish");
  const modeLabel = t(nextMode === "dark" ? "switchToDark" : "switchToLight");

  async function changeLocale() {
    if (busy) return;
    setBusy(true);
    setError(false);
    try {
      await update({ locale: nextLocale });
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  async function changeMode() {
    if (busy) return;
    setBusy(true);
    setError(false);
    const previous = theme ?? "system";
    setTheme(nextMode);
    try {
      await update({ themePreference: nextMode });
    } catch {
      setTheme(previous);
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  const shortcutClass = "size-11 justify-self-center rounded-full border-0 bg-transparent text-sidebar-foreground/80 shadow-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring";
  return <div className="space-y-2 border-t border-sidebar-border/40 pt-2">
    <div className="grid grid-cols-4 gap-2" aria-label={t("quickActions")}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button type="button" size="icon" variant="ghost" className={shortcutClass}
            disabled={busy} aria-label={languageLabel} onClick={() => void changeLocale()}>
            <Languages aria-hidden="true" className="size-5!" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">{languageLabel}</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button type="button" size="icon" variant="ghost" className={shortcutClass}
            disabled={busy} aria-label={modeLabel} onClick={() => void changeMode()}>
            {resolvedTheme === "dark" ? <Sun aria-hidden="true" className="size-5!" /> : <Moon aria-hidden="true" className="size-5!" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">{modeLabel}</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button asChild size="icon" variant="ghost" className={shortcutClass} aria-label={t("settingsShortcut")}>
            <Link href="/settings/profile" onClick={() => { if (isMobile) setOpenMobile(false); }}>
              <Settings aria-hidden="true" className="size-5!" />
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">{t("settingsShortcut")}</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button type="button" size="icon" variant="ghost" className={shortcutClass}
            aria-label={t("signOut")} onClick={onSignOut}>
            <LogOut aria-hidden="true" className="size-5!" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">{t("signOut")}</TooltipContent>
      </Tooltip>
    </div>
    {error && <p role="alert" className="text-xs text-destructive">{t("quickActionError")}</p>}
  </div>;
}
