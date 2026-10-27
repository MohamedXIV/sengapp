import { ConvexError, v } from "convex/values";
import { action, internalMutation, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { getVerifiedAuthUser, assertActiveMemberActor, requireAuthorizedProfile } from "./lib/permissions";
import { generateSecureInvitationToken, hashInvitationToken, createTokenHint } from "./lib/crypto";
import {
  assertConnectionIssueAllowed, canonicalPair, evaluateConnectionAcceptance,
  isConnectionCode, MAX_DAILY_CONNECTION_INVITES, MAX_PENDING_CONNECTION_INVITES,
} from "./lib/connectionPolicy";

type DatabaseContext = QueryCtx | MutationCtx;

async function connected(ctx: DatabaseContext, first: Id<"profiles">, second: Id<"profiles">) {
  const [left, right] = canonicalPair(first, second);
  return (await ctx.db.query("connections").withIndex("by_pair",
    (q) => q.eq("leftProfileId", left as Id<"profiles">)
      .eq("rightProfileId", right as Id<"profiles">)).unique()) !== null;
}

async function blocked(ctx: DatabaseContext, first: Id<"profiles">, second: Id<"profiles">) {
  const [aToB, bToA] = await Promise.all([
    ctx.db.query("blocks").withIndex("by_pair",
      (q) => q.eq("blockerProfileId", first).eq("blockedProfileId", second)).first(),
    ctx.db.query("blocks").withIndex("by_pair",
      (q) => q.eq("blockerProfileId", second).eq("blockedProfileId", first)).first(),
  ]);
  return aToB !== null || bToA !== null;
}

async function readCode(ctx: DatabaseContext, code: string) {
  if (!isConnectionCode(code)) return null;
  const hash = await hashInvitationToken(code);
  return ctx.db.query("connectionInvites")
    .withIndex("by_code_hash", (q) => q.eq("codeHash", hash)).unique();
}

async function invitationOutcome(ctx: DatabaseContext, code: string) {
  const me = await requireAuthorizedProfile(ctx);
  const verifiedEmail = (await getVerifiedAuthUser(ctx)).email;
  const invite = await readCode(ctx, code);
  const sender = invite ? await ctx.db.get(invite.issuedBy) : null;
  if (!invite || !sender || sender.status !== "active") {
    return { me, invite, sender, outcome: { valid: false as const, reason: "UNAVAILABLE" as const } };
  }
  const [hasBlock, hasConnection] = invite.issuedBy === me._id ? [false, false] : await Promise.all([
    blocked(ctx, invite.issuedBy, me._id),
    connected(ctx, invite.issuedBy, me._id),
  ]);
  const outcome = evaluateConnectionAcceptance({
    status: invite.status, expiresAt: invite.expiresAt,
    issuerProfileId: invite.issuedBy, recipientEmail: invite.recipientEmail,
  }, me._id, verifiedEmail, Date.now(), hasBlock, hasConnection);
  return { me, invite, sender, outcome };
}

// Only this server action can create unguessable token material.
export const issue = action({
  args: {
    ttlHours: v.number(),
    recipientEmail: v.optional(v.string()),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ code: string; expiresAt: number }> => {
    const user = await getVerifiedAuthUser(ctx);
    assertConnectionIssueAllowed(args.ttlHours, 0, 0);
    const code = generateSecureInvitationToken();
    const result: { expiresAt: number } = await ctx.runMutation(
      internal.connectionInvites.insertIssuedCode, {
        issuerAuthUserId: user.userId, ttlHours: args.ttlHours,
        codeHash: await hashInvitationToken(code), codeHint: createTokenHint(code),
        recipientEmail: args.recipientEmail?.trim().toLowerCase() || undefined,
        note: args.note?.trim() || undefined,
      },
    );
    return { code, expiresAt: result.expiresAt };
  },
});

export const insertIssuedCode = internalMutation({
  args: {
    issuerAuthUserId: v.string(), ttlHours: v.number(), codeHash: v.string(),
    codeHint: v.string(), recipientEmail: v.optional(v.string()), note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const issuer = await ctx.db.query("profiles")
      .withIndex("by_auth_user_id", (q) => q.eq("authUserId", args.issuerAuthUserId)).unique();
    const member = assertActiveMemberActor(issuer);
    const now = Date.now();
    const [pending, lastDay] = await Promise.all([
      ctx.db.query("connectionInvites").withIndex("by_issuer_status_expiry",
        (q) => q.eq("issuedBy", member._id).eq("status", "pending").gt("expiresAt", now))
        .take(MAX_PENDING_CONNECTION_INVITES),
      ctx.db.query("connectionInvites").withIndex("by_issuer_created",
        (q) => q.eq("issuedBy", member._id).gt("createdAt", now - 86_400_000))
        .take(MAX_DAILY_CONNECTION_INVITES),
    ]);
    assertConnectionIssueAllowed(args.ttlHours, pending.length, lastDay.length);
    if (args.note && args.note.length > 200) throw new ConvexError({ code: "INVALID_NOTE" });
    if (args.recipientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(args.recipientEmail)) {
      throw new ConvexError({ code: "INVALID_EMAIL" });
    }
    if (await ctx.db.query("connectionInvites")
      .withIndex("by_code_hash", (q) => q.eq("codeHash", args.codeHash)).first()) {
      throw new ConvexError({ code: "TOKEN_COLLISION" });
    }
    const expiresAt = now + args.ttlHours * 3_600_000;
    const id = await ctx.db.insert("connectionInvites", {
      codeHash: args.codeHash, codeHint: args.codeHint, issuedBy: member._id,
      recipientEmail: args.recipientEmail, note: args.note, status: "pending",
      createdAt: now, expiresAt,
    });
    await ctx.db.insert("auditLogs", {
      actorProfileId: member._id, action: "connection_invite.issued",
      targetId: String(id), createdAt: now,
    });
    return { expiresAt };
  },
});

export const preview = query({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const { sender, invite, outcome } = await invitationOutcome(ctx, code);
    if (!outcome.valid || !sender || !invite) {
      return { valid: false as const, reason: !outcome.valid ? outcome.reason : "UNAVAILABLE" };
    }
    return {
      valid: true as const, senderDisplayName: sender.displayName,
      note: invite.note, expiresAt: invite.expiresAt,
    };
  },
});

export const accept = mutation({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const { me, invite, outcome } = await invitationOutcome(ctx, code);
    if (!invite || !outcome.valid) throw new ConvexError({ code: "INVALID_CONNECTION_INVITE" });
    const [left, right] = canonicalPair(invite.issuedBy, me._id);
    const now = Date.now();
    const connectionId = await ctx.db.insert("connections", {
      leftProfileId: left as Id<"profiles">, rightProfileId: right as Id<"profiles">,
      createdBy: me._id, createdAt: now,
    });
    await ctx.db.patch(invite._id, {
      status: "accepted", acceptedBy: me._id, acceptedAt: now,
    });
    await ctx.db.insert("auditLogs", {
      actorProfileId: me._id, action: "connection_invite.accepted",
      targetId: String(invite._id), createdAt: now,
    });
    return { connectionId };
  },
});

export const decline = mutation({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const { me, invite, outcome } = await invitationOutcome(ctx, code);
    if (!invite || !outcome.valid) throw new ConvexError({ code: "INVALID_CONNECTION_INVITE" });
    const now = Date.now();
    await ctx.db.patch(invite._id, {
      status: "declined", declinedBy: me._id, declinedAt: now,
    });
    await ctx.db.insert("auditLogs", {
      actorProfileId: me._id, action: "connection_invite.declined",
      targetId: String(invite._id), createdAt: now,
    });
  },
});

export const revoke = mutation({
  args: { invitationId: v.id("connectionInvites") },
  handler: async (ctx, { invitationId }) => {
    const me = await requireAuthorizedProfile(ctx);
    const invite = await ctx.db.get(invitationId);
    if (!invite || invite.issuedBy !== me._id || invite.status !== "pending") {
      throw new ConvexError({ code: "INVALID_CONNECTION_INVITE" });
    }
    const now = Date.now();
    await ctx.db.patch(invitationId, { status: "revoked", revokedAt: now });
    await ctx.db.insert("auditLogs", {
      actorProfileId: me._id, action: "connection_invite.revoked",
      targetId: String(invitationId), createdAt: now,
    });
  },
});

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const me = await requireAuthorizedProfile(ctx);
    const invites = await ctx.db.query("connectionInvites")
      .withIndex("by_issued_by", (q) => q.eq("issuedBy", me._id))
      .order("desc").take(50);
    return invites.map(({ _id, codeHint, recipientEmail, note, status, createdAt, expiresAt }) =>
      ({ _id, codeHint, recipientEmail, note, status, createdAt, expiresAt }));
  },
});
