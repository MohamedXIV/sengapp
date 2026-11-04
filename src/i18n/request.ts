import { headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { getCatalog } from "@/lib/i18n/catalog";
import { chooseLocale } from "@/lib/i18n/locale";

export default getRequestConfig(async () => {
  const acceptLanguage = (await headers()).get("accept-language");
  const locale = chooseLocale(acceptLanguage);
  return { locale, messages: getCatalog(locale) };
});
