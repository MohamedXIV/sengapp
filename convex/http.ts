import { httpRouter } from "convex/server";
import { authComponent, createAuth } from "./auth";

/**
 * Convex HTTP Router
 * Mounts Better Auth route handlers on the Convex deployment.
 */
const http = httpRouter();

authComponent.registerRoutes(http, createAuth);

export default http;
