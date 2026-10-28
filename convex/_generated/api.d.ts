/* Generated-format bootstrap types. Regenerate with `npx convex dev` when connected. */
import type { ApiFromModules, FilterApi, FunctionReference } from "convex/server";
import type * as profiles from "../profiles.js";
import type * as connectionInvites from "../connectionInvites.js";
import type * as connections from "../connections.js";

declare const fullApi: ApiFromModules<{
  profiles: typeof profiles;
  connectionInvites: typeof connectionInvites;
  connections: typeof connections;
}>;
export declare const api: FilterApi<typeof fullApi, FunctionReference<any, "public">>;
export declare const internal: FilterApi<typeof fullApi, FunctionReference<any, "internal">>;
export declare const components: Record<string, never>;
