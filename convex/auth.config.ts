import { getAuthConfigProvider } from "@convex-dev/better-auth/auth-config";
import type { AuthConfig } from "convex/server";

/**
 * Convex Auth Provider Configuration
 * Uses the official @convex-dev/better-auth integration provider.
 */
const authConfig: AuthConfig = {
  providers: [getAuthConfigProvider()],
};

export default authConfig;
