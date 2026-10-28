export const supportedLocales = ["en", "ar"] as const;
export type AppLocale = (typeof supportedLocales)[number];

/** Profile language wins; the first browser preference is used for visitors. */
export function chooseLocale(acceptLanguage: string | null | undefined, preference?: string | null): AppLocale {
  if (preference === "en" || preference === "ar") return preference;
  const first = acceptLanguage?.split(",")[0]?.split(";")[0]?.trim().toLowerCase();
  return first === "ar" || first?.startsWith("ar-") ? "ar" : "en";
}

export function getLocaleDirection(locale: AppLocale): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr";
}
