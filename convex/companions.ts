import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuthorizedProfile } from "./lib/permissions";
import { denyCompanion, readCompanionScope, requireCallerInConversation } from "./lib/companionPolicy";

const MAX_COMPANIONS_PER_OWNER = 3;
const MAX_NAME_LENGTH = 40;

export const createMine = mutation({
  args: { handle: v.string(), displayName: v.string() },
  returns: v.id("companions"),
  handler: async (ctx, { handle, displayName }) => {
    const me = await requireAuthorizedProfile(ctx);
    const slug = handle.trim().toLowerCase();
    const name = displayName.trim();
    if (!/^[a-z][a-z0-9_]{1,23}$/.test(slug) || !name || name.length > MAX_NAME_LENGTH) {
      throw new ConvexError({ code: "INVALID_COMPANION" });
    }
    const existing = await ctx.db.query("companions")
      .withIndex("by_owner_handle", q => q.eq("ownerProfileId", me._id).eq("handle", slug))
      .unique();
    if (existing) return existing._id; // identity-safe retry
    const all = await ctx.db.query("companions")
      .withIndex("by_owner", q => q.eq("ownerProfileId", me._id)).take(MAX_COMPANIONS_PER_OWNER);
    if (all.length >= MAX_COMPANIONS_PER_OWNER) {
      throw new ConvexError({ code: "COMPANION_LIMIT" });
    }
    const now = Date.now();
    return ctx.db.insert("companions", {
      ownerProfileId: me._id, handle: slug, displayName: name,
      status: "active", revision: 1, createdAt: now, updatedAt: now,
    });
  },
});

export const listMine = query({
  args: {},
  handler: async ctx => {
    const me = await requireAuthorizedProfile(ctx);
    return ctx.db.query("companions")
      .withIndex("by_owner", q => q.eq("ownerProfileId", me._id)).take(MAX_COMPANIONS_PER_OWNER);
  },
});

export const setEnabled = mutation({
  args: { companionId: v.id("companions"), enabled: v.boolean() },
  returns: v.null(),
  handler: async (ctx, { companionId, enabled }) => {
    const me = await requireAuthorizedProfile(ctx);
    const companion = await ctx.db.get(companionId);
    if (!companion || companion.ownerProfileId !== me._id) return denyCompanion();
    const status = enabled ? "active" : "disabled";
    if (companion.status !== status) {
      await ctx.db.patch(companionId, { status, revision: companion.revision + 1, updatedAt: Date.now() });
    }
    return null;
  },
});

export const setConsent = mutation({
  args: {
    companionId: v.id("companions"),
    conversationId: v.id("conversations"),
    granted: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, { companionId, conversationId, granted }) => {
    const me = await requireCallerInConversation(ctx, conversationId);
    const scope = await readCompanionScope(ctx, conversationId, companionId);
    const membership = scope.memberships.find(row => row.profileId === me._id);
    if (!membership) return denyCompanion();
    const existing = await ctx.db.query("companionConsents")
      .withIndex("by_conversation_companion_profile",
        q => q.eq("conversationId", conversationId).eq("companionId", companionId).eq("profileId", me._id))
      .unique();
    if (existing?.granted === granted && existing.membershipJoinedAt === membership.joinedAt) return null;
    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        granted, membershipJoinedAt: membership.joinedAt,
        revision: existing.revision + 1, updatedAt: now,
      });
    } else {
      await ctx.db.insert("companionConsents", {
        conversationId, companionId, profileId: me._id, granted,
        membershipJoinedAt: membership.joinedAt, revision: 1, updatedAt: now,
      });
    }
    // No prompt text, private companion memory or provider credentials in audit.
    await ctx.db.insert("auditLogs", {
      actorProfileId: me._id,
      action: granted ? "companion.consent.granted" : "companion.consent.revoked",
      targetId: String(conversationId) + ":" + String(companionId),
      createdAt: now,
    });
    return null;
  },
});

export const consentStatus = query({
  args: { companionId: v.id("companions"), conversationId: v.id("conversations") },
  returns: v.object({
    totalMembers: v.number(), grantedMembers: v.number(),
    canInvoke: v.boolean(), isOwner: v.boolean(),
  }),
  handler: async (ctx, { companionId, conversationId }) => {
    const me = await requireCallerInConversation(ctx, conversationId);
    const scope = await readCompanionScope(ctx, conversationId, companionId);
    return {
      totalMembers: scope.memberships.length, grantedMembers: scope.grantedCount,
      canInvoke: scope.approved && scope.companion.status === "active"
        && scope.companion.ownerProfileId === me._id,
      isOwner: scope.companion.ownerProfileId === me._id,
    };
  },
});
