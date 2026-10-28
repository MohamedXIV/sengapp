import { NextIntlClientProvider } from "next-intl";
import en from "../../messages/en.json";

export function EnglishTestProvider({ children }: { children: React.ReactNode }) {
  return <NextIntlClientProvider locale="en" messages={en} timeZone="UTC">{children}</NextIntlClientProvider>;
}
