"use client";

import { useLayoutEffect, type ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { DirectionProvider } from "@/components/ui/direction";
import { getCatalog } from "@/lib/i18n/catalog";
import { getLocaleDirection, type AppLocale } from "@/lib/i18n/locale";

export function AccountLocaleProvider({ children, locale }: { children: ReactNode; locale: AppLocale }) {
  const direction = getLocaleDirection(locale);

  // Authenticated preferences override visitor defaults. Never leave a prior
  // member's language/direction on the shared document after account switch.
  useLayoutEffect(() => {
    const element = document.documentElement;
    const originalLang = element.lang;
    const originalDir = element.dir;
    element.lang = locale;
    element.dir = direction;
    return () => {
      element.lang = originalLang;
      element.dir = originalDir;
    };
  }, [locale, direction]);

  return (
    <NextIntlClientProvider locale={locale} messages={getCatalog(locale)}>
      <DirectionProvider dir={direction} direction={direction}>{children}</DirectionProvider>
    </NextIntlClientProvider>
  );
}
