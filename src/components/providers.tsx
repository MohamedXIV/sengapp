"use client";

import type { ReactNode } from "react";
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { arSA } from "@clerk/localizations";
import { ThemeProvider } from "next-themes";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import type { AppLocale } from "@/lib/i18n/locale";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const convexClient = convexUrl ? new ConvexReactClient(convexUrl) : null;

export function Providers({ children, locale }: { children: ReactNode; locale: AppLocale }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {convexClient && clerkKey
        ? <ClerkProvider publishableKey={clerkKey} signInUrl="/login"
            localization={locale === "ar" ? arSA : undefined}>
            <ConvexProviderWithClerk client={convexClient} useAuth={useAuth}>
              {children}
            </ConvexProviderWithClerk>
          </ClerkProvider>
        : children}
    </ThemeProvider>
  );
}

