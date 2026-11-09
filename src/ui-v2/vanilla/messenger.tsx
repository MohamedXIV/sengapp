"use client";

import { useEffect, useMemo, type CSSProperties } from "react";
import type { AppLocale } from "@/lib/i18n/locale";
import { useTheme } from "next-themes";
import { NextIntlClientProvider } from "next-intl";
import { DirectionProvider } from "@/components/ui/direction";
import { getCatalog } from "@/lib/i18n/catalog";
import { getLocaleDirection } from "@/lib/i18n/locale";
import { ClassicShell } from "../classic/classic-shell";
import { CozyShell } from "../cozy/cozy-shell";
import { themeVariables, type PaletteMode } from "../shared/theme-utils";
import { WorkspaceProvider, useWorkspace } from "../shared/workspace-state";

/** Only the preview palette is local. Mode is the existing next-themes Light/Dark/System setting. */
function WorkspaceSurface() {
  const { shell, appearance } = useWorkspace();
  const { resolvedTheme } = useTheme();
  const mode: PaletteMode = resolvedTheme === "dark" ? "dark" : "light";
  const locale = appearance.locale;
  const direction = getLocaleDirection(locale);
  const tokens = useMemo(() => themeVariables(
    appearance.palettes[mode], mode, appearance.corners, appearance.shadow,
  ), [appearance.palettes,appearance.corners,appearance.shadow,mode]);

  // Radix menus and Sheets portal to document.body, outside the UI v2 subtree.
  // Bridge the same semantic tokens for portaled content only while this route is mounted.
  useEffect(() => {
    const body = document.body, previous = new Map<string,string>();
    for (const [key,value] of Object.entries(tokens)) {
      previous.set(key,body.style.getPropertyValue(key));
      body.style.setProperty(key,value);
    }
    return () => {
      for (const [key,value] of previous) {
        if (value) body.style.setProperty(key,value);
        else body.style.removeProperty(key);
      }
    };
  },[tokens]);
  return (
    <NextIntlClientProvider locale={locale} messages={getCatalog(locale)}>
      <DirectionProvider dir={direction} direction={direction}>
        <div data-sengapp-shadcn-blocks data-shell={shell} data-mode={mode}
          data-corners={appearance.corners} data-shadow={appearance.shadow}
          lang={locale} dir={direction}
          style={tokens as CSSProperties}
          className="h-dvh min-h-0 w-full overflow-hidden bg-background text-foreground">
          {shell === "classic" ? <ClassicShell /> : <CozyShell />}
        </div>
      </DirectionProvider>
    </NextIntlClientProvider>
  );
}
export function VanillaMessenger({initialLocale="en"}:{initialLocale?:AppLocale}) {
  return <WorkspaceProvider initialLocale={initialLocale}><WorkspaceSurface /></WorkspaceProvider>;
}
