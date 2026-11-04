import { NextIntlClientProvider } from "next-intl";
import en from "../../messages/en.json";
import ar from "../../messages/ar.json";

export function EnglishTestProvider({ children }: { children: React.ReactNode }) {
  return <NextIntlClientProvider locale="en" messages={en} timeZone="UTC">{children}</NextIntlClientProvider>;
}

export function ArabicTestProvider({ children }: { children: React.ReactNode }) {
  return <NextIntlClientProvider locale="ar" messages={ar} timeZone="UTC">{children}</NextIntlClientProvider>;
}

