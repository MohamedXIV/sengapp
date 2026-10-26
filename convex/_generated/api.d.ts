/* Generated-format bootstrap types. Regenerate with `npx convex dev` when connected. */
import type { ApiFromModules, FilterApi, FunctionReference } from "convex/server";
import type { createClient } from "@convex-dev/better-auth";
import type * as auth from "../auth.js";
import type * as profiles from "../profiles.js";
import type * as invites from "../invites.js";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  profiles: typeof profiles;
  invites: typeof invites;
}>;
export declare const api: FilterApi<typeof fullApi, FunctionReference<any, "public">>;
export declare const internal: FilterApi<typeof fullApi, FunctionReference<any, "internal">>;
export declare const components: {
  betterAuth: Parameters<typeof createClient>[0];
};
