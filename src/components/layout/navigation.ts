import type { AppLocale } from "@/lib/i18n/locale";
import { getLocaleDirection } from "@/lib/i18n/locale";

export function getNavigationSide(locale: AppLocale): "left" | "right" {
  return getLocaleDirection(locale) === "rtl" ? "right" : "left";
}

export function isNavigationItemActive(pathname: string, href: string): boolean {
  if (href.includes("#")) return false;
  return pathname === href;
}
