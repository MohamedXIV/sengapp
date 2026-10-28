import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import { Providers } from "@/components/providers";
import { DirectionProvider } from "@/components/ui/direction";
import { getLocaleDirection, type AppLocale } from "@/lib/i18n/locale";
import "@fontsource-variable/inter";
import "@fontsource-variable/nunito";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sengapp",
  description: "A little place for big conversations.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = (await getLocale()) as AppLocale;
  const direction = getLocaleDirection(locale);
  return (
    <html lang={locale} dir={direction} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <NextIntlClientProvider>
          <DirectionProvider dir={direction} direction={direction}>
            <Providers locale={locale}>{children}</Providers>
          </DirectionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

