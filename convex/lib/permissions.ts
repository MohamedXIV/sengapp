import { ConvexError } from "convex/values";
import type { Doc } from "../_generated/dataModel";
import type { QueryCtx, MutationCtx } from "../_generated/server";

type AuthContext = Pick<QueryCtx | MutationCtx, "auth">;

export type AuthorizedProfile = Doc<"profiles">;
export interface AuthenticatedActor {
  role: "operator" | "member";
  status: "pending_invite" | "active" | "suspended";
}

export function assertActiveMemberActor<T extends AuthenticatedActor>(actor: T | null): T {
  if (!actor) throw new ConvexError({ code: "UNAUTHENTICATED" });
  if (actor.status === "suspended") throw new ConvexError({ code: "SUSPENDED" });
  if (actor.status !== "active") throw new ConvexError({ code: "INVITATION_REQUIRED" });
  return actor;
}

export function assertOperatorActor<T extends AuthenticatedActor>(actor: T | null): T {
  const member = assertActiveMemberActor(actor);
  if (member.role !== "operator") throw new ConvexError({ code: "FORBIDDEN" });
  return member;
}

export function isAllowedVerifiedOperator(
  verifiedEmail: string | undefined,
  emailVerified: boolean,
  configuredEmails: string | undefined,
): boolean {
  if (!emailVerified || !verifiedEmail || !configuredEmails) return false;
  const normalized = verifiedEmail.trim().toLowerCase();
  return configuredEmails.split(",").some((value) => value.trim().toLowerCase() === normalized);
}

// A signed Clerk identity needs the explicit verification claim from
// Clerk's Convex JWT template; email alone is insufficient.
export async function readVerifiedIdentity(ctx: AuthContext) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity || identity.email_verified !== true
    || typeof identity.email !== "string" || !identity.email.trim()
    || !identity.subject) return null;
  return {
    userId: identity.subject,
    email: identity.email.trim().toLowerCase(),
    name: typeof identity.name === "string" ? identity.name : undefined,
  };
}

export async function getVerifiedAuthUser(ctx: AuthContext) {
  const user = await readVerifiedIdentity(ctx);
  if (!user) {
    throw new ConvexError({ code: "VERIFIED_SIGN_IN_REQUIRED" });
  }
  return user;
}

export async function requireAuthorizedProfile(ctx: QueryCtx | MutationCtx) {
  const authUser = await getVerifiedAuthUser(ctx);
  const profile = await ctx.db.query("profiles")
    .withIndex("by_auth_user_id", (q) => q.eq("authUserId", authUser.userId)).unique();
  if (!profile) throw new ConvexError({ code: "INVITATION_REQUIRED" });
  return assertActiveMemberActor(profile);
}

export async function requireOperator(ctx: QueryCtx | MutationCtx) {
  return assertOperatorActor(await requireAuthorizedProfile(ctx));
}
