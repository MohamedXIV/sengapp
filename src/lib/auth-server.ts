import { convexBetterAuthNextJs } from "@convex-dev/better-auth/nextjs";

const configured = Boolean(
  process.env.NEXT_PUBLIC_CONVEX_URL && process.env.NEXT_PUBLIC_CONVEX_SITE_URL,
);

// Preserve a buildable welcome shell before the owner provisions Convex.
// Auth endpoints fail closed (503); no mock sign-in or unprotected fallback.
const server = configured ? convexBetterAuthNextJs({
  convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL!,
  convexSiteUrl: process.env.NEXT_PUBLIC_CONVEX_SITE_URL!,
}) : null;

const notConfigured = () => Response.json(
  { error: "Sengapp authentication is not configured." },
  { status: 503 },
);

export const handler = server?.handler ?? {
  GET: notConfigured,
  POST: notConfigured,
};
export const preloadAuthQuery = server?.preloadAuthQuery;
export const isAuthenticated = server?.isAuthenticated;
export const getToken = server?.getToken;
export const fetchAuthQuery = server?.fetchAuthQuery;
export const fetchAuthMutation = server?.fetchAuthMutation;
export const fetchAuthAction = server?.fetchAuthAction;
