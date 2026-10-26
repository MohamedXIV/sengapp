"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { ConvexReactClient } from "convex/react";
import { ConvexBetterAuthProvider, type AuthClient } from "@convex-dev/better-auth/react";
import { authClient } from "@/lib/auth-client";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convexClient = convexUrl ? new ConvexReactClient(convexUrl) : null;

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {convexClient
        // Upstream type bug: @convex-dev/better-auth 0.12.5 rejects Better Auth >=1.6.22
        // ReactAuthClient (get-convex/better-auth#420). This cast is only at that boundary.
        ? <ConvexBetterAuthProvider client={convexClient} authClient={authClient as unknown as AuthClient}>
            {children}
          </ConvexBetterAuthProvider>
        : children}
    </ThemeProvider>
  );
}
