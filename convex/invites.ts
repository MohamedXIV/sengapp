import { ConvexError, v } from "convex/values";
import { action, internalMutation, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { authComponent } from "./auth";
import { assertOperatorActor, getVerifiedAuthUser, requireOperator } from "./lib/permissions";
import { generateSecureInvitationToken, hashInvitationToken, createTokenHint } from "./lib/crypto";
import { evaluateInvitationRedemption } from "./lib/invitationDomain";
import { assertInviteIssueAllowed, MAX_PENDING_INVITES } from "./lib/invitePolicy";

const handlePattern = /^[a-z0-9_]{3,24}$/;

// Must be an action: secure randomness is generated server-side, outside
// Convex's deterministic transactional mutation runtime.
export const issue = action({
  args: {
    ttlHours: v.number(),
    recipientEmail: v.optional(v.string()),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ code: string; expiresAt: number }> => {
    const authUser = await authComponent.safeGetAuthUser(ctx);
    if (!authUser?.emailVerified || !authUser.email) {
      throw new ConvexError({ code: "VERIFIED_SIGN_IN_REQUIRED" });
    }
    assertInviteIssueAllowed(args.ttlHours, 0);
    const code = generateSecureInvitationToken();
    const issued: { expiresAt: number } = await ctx.runMutation(internal.invites.insertIssuedCode, {
      issuerAuthUserId: String(authUser._id),
      codeHash: await hashInvitationToken(code),
      codeHint: createTokenHint(code),
      ttlHours: args.ttlHours,
      recipientEmail: args.recipientEmail?.trim().toLowerCase() || undefined,
      note: args.note?.trim() || undefined,
    });
    return { code, expiresAt: issued.expiresAt };
  },
});

export const insertIssuedCode = internalMutation({
  args: {
    issuerAuthUserId: v.string(),
    codeHash: v.string(),
    codeHint: v.string(),
    ttlHours: v.number(),
    recipientEmail: v.optional(v.string()),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const issuer = await ctx.db.query("profiles")
      .withIndex("by_auth_user_id", (q) => q.eq("authUserId", args.issuerAuthUserId)).unique();
    const operator = assertOperatorActor(issuer);
    const now = Date.now();
    const outstanding = await ctx.db.query("invitations")
      .withIndex("by_issuer_status_expiry", (q) => q
        .eq("issuedBy", operator._id)
        .eq("status", "pending")
        .gt("expiresAt", now))
      .take(MAX_PENDING_INVITES);
    assertInviteIssueAllowed(args.ttlHours, outstanding.length);
    if (args.note && args.note.length > 200) throw new ConvexError({ code: "INVALID_NOTE" });
    if (args.recipientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(args.recipientEmail)) {
      throw new ConvexError({ code: "INVALID_EMAIL" });
    }
    const collision = await ctx.db.query("invitations")
      .withIndex("by_code_hash", (q) => q.eq("codeHash", args.codeHash)).unique();
    if (collision) throw new ConvexError({ code: "TOKEN_COLLISION" });
    const expiresAt = now + args.ttlHours * 3_600_000;
    const id = await ctx.db.insert("invitations", {
      codeHash: args.codeHash,
      codeHint: args.codeHint,
      issuedBy: operator._id,
      recipientEmail: args.recipientEmail,
      note: args.note,
      status: "pending",
      createdAt: now,
      expiresAt,
    });
    await ctx.db.insert("auditLogs", {
      actorProfileId: operator._id, action: "invitation.issued",
      targetId: String(id), createdAt: now,
    });
    return { expiresAt };
  },
});

// Convex mutations are atomic: invite consumption and profile creation commit together.
export const redeem = mutation({
  args: {
    code: v.string(),
    displayName: v.string(),
    handle: v.string(),
    locale: v.union(v.literal("en"), v.literal("ar")),
  },
  handler: async (ctx, args) => {
    const authUser = await getVerifiedAuthUser(ctx);
    const authUserId = String(authUser._id);
    const existing = await ctx.db.query("profiles")
      .withIndex("by_auth_user_id", (q) => q.eq("authUserId", authUserId)).unique();
    if (existing) throw new ConvexError({ code: "ALREADY_MEMBER" });
    if (!/^[A-Za-z0-9_-]{43}$/.test(args.code)) {
      throw new ConvexError({ code: "INVALID_INVITATION" });
    }

    const codeHash = await hashInvitationToken(args.code);
    const invite = await ctx.db.query("invitations")
      .withIndex("by_code_hash", (q) => q.eq("codeHash", codeHash)).unique();
    const outcome = evaluateInvitationRedemption(invite ? {
      status: invite.status,
      expiresAt: invite.expiresAt,
      invitedEmail: invite.recipientEmail,
      redeemedByUserId: invite.redeemedBy ? String(invite.redeemedBy) : undefined,
    } : null, authUser.email, Date.now());
    if (!outcome.valid || !invite) throw new ConvexError({ code: "INVALID_INVITATION" });

    const displayName = args.displayName.trim();
    const handle = args.handle.trim().toLowerCase();
    if (displayName.length < 1 || displayName.length > 50 || !handlePattern.test(handle)) {
      throw new ConvexError({ code: "INVALID_PROFILE" });
    }
    const usedHandle = await ctx.db.query("profiles")
      .withIndex("by_handle", (q) => q.eq("handle", handle)).unique();
    if (usedHandle) throw new ConvexError({ code: "HANDLE_TAKEN" });
    const now = Date.now();
    const profileId = await ctx.db.insert("profiles", {
      authUserId, email: authUser.email.toLowerCase(),
      displayName, handle, role: "member", status: "active",
      joinedAt: now, updatedAt: now, avatarPresetKey: "acorn-scout",
      avatarAccentColor: "#C68A45", locale: args.locale,
      textDirection: "auto", themePreference: "system", reducedMotion: false,
      presencePreferences: {
        onlineStatus: true, lastSeen: true, readReceipts: true, typingIndicators: true,
      },
      redeemedInvitationId: invite._id,
    });
    await ctx.db.patch(invite._id, {
      status: "redeemed", redeemedBy: profileId, redeemedAt: now,
    });
    await ctx.db.insert("auditLogs", {
      actorProfileId: profileId, action: "invitation.redeemed",
      targetId: String(invite._id), createdAt: now,
    });
    return { profileId };
  },
});

export const revoke = mutation({
  args: { invitationId: v.id("invitations") },
  handler: async (ctx, { invitationId }) => {
    const operator = await requireOperator(ctx);
    const invite = await ctx.db.get(invitationId);
    if (!invite || invite.status !== "pending") throw new ConvexError({ code: "INVALID_INVITATION" });
    const now = Date.now();
    await ctx.db.patch(invitationId, { status: "revoked", revokedAt: now });
    await ctx.db.insert("auditLogs", {
      actorProfileId: operator._id, action: "invitation.revoked",
      targetId: String(invitationId), createdAt: now,
    });
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const operator = await requireOperator(ctx);
    const invites = await ctx.db.query("invitations")
      .withIndex("by_issued_by", (q) => q.eq("issuedBy", operator._id))
      .order("desc").take(50);
    return invites.map((invite) => ({
      _id: invite._id,
      codeHint: invite.codeHint,
      recipientEmail: invite.recipientEmail,
      note: invite.note,
      status: invite.status,
      expiresAt: invite.expiresAt,
      createdAt: invite.createdAt,
    }));
  },
});
