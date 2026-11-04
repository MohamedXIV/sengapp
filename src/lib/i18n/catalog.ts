import en from "../../../messages/en.json";
import ar from "../../../messages/ar.json";
import type { AppLocale } from "./locale";

export const catalogs = { en, ar };

export function getCatalog(locale: AppLocale) {
  return catalogs[locale];
}
