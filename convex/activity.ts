import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuthorizedProfile } from "./lib/permissions";
import { assertDirectNotBlocked, requireDirectConversation } from "./lib/directAccess";
import { requireGroupMember } from "./lib/groupAccess";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

const PRESENCE_TTL_MS = 70_000;
const HEARTBEAT_MIN_MS = 25_000;
const MAX_ACTIVE_SESSIONS = 12;
const SESSION_ID_PATTERN = /^[a-f0-9-]{36}$/;
const TYPING_TTL_MS = 7_000;
const TYPING_MIN_MS = 2_500;
const MAX_GROUP_MEMBERS = 33;

type DbCtx = QueryCtx | MutationCtx;

/** Never accept a profileId from the caller for any activity write. */
async function requireConversationAccess(ctx: DbCtx, conversationId: Id<"conversations">) {
  const convo = await ctx.db.get(conversationId);
  if (convo?.kind === "group") {
    const group = await requireGroupMember(ctx, conversationId);
    return { kind: "group" as const, ...group };
  }
  const direct = await requireDirectConversation(ctx, conversationId);
  await assertDirectNotBlocked(ctx, direct.me._id, direct.peer._id);
  return { kind: "direct" as const, ...direct };
}

/** A single cheap profile document tracks a bounded set of foreground tabs.
 * Closing one tab cannot mistakenly mark another active tab offline.
 * The client attempts to retire tabs early; leases still expire if the browser
 * terminates abruptly without delivering a mutation. */
export const heartbeat = mutation({
  args: { sessionId: v.string() },
  returns: v.null(),
  handler: async (ctx, { sessionId }) => {
    const me = await requireAuthorizedProfile(ctx);
    if (!SESSION_ID_PATTERN.test(sessionId)) return null;
    if (!me.presencePreferences.onlineStatus && !me.presencePreferences.lastSeen) return null;
    const now = Date.now();
    const existing = await ctx.db.query("profileActivity")
      .withIndex("by_profile", q => q.eq("profileId", me._id)).unique();
    const current = existing?.sessions?.find(item => item.sessionId === sessionId);
    if (current && now - current.lastActiveAt < HEARTBEAT_MIN_MS) return null;
    const sessions = (existing?.sessions ?? [])
      .filter(item => item.sessionId !== sessionId && item.lastActiveAt + PRESENCE_TTL_MS > now)
      .sort((left, right) => right.lastActiveAt - left.lastActiveAt)
      .slice(0, MAX_ACTIVE_SESSIONS - 1);
    sessions.push({ sessionId, lastActiveAt: now });
    if (existing) await ctx.db.patch(existing._id, { sessions, lastActiveAt: now });
    else await ctx.db.insert("profileActivity", { profileId: me._id, lastActiveAt: now, sessions });
    return null;
  },
});

/** Best effort: unmount, tab hidden and explicit sign-out can retire only
 * their own lease. Other foreground tabs stay online. */
export const endSession = mutation({
  args: { sessionId: v.string() },
  returns: v.null(),
  handler: async (ctx, { sessionId }) => {
    const me = await requireAuthorizedProfile(ctx);
    if (!SESSION_ID_PATTERN.test(sessionId)) return null;
    const existing = await ctx.db.query("profileActivity")
      .withIndex("by_profile", q => q.eq("profileId", me._id)).unique();
    if (!existing?.sessions?.some(item => item.sessionId === sessionId)) return null;
    await ctx.db.patch(existing._id, {
      sessions: existing.sessions.filter(item => item.sessionId !== sessionId),
      lastActiveAt: Math.max(Date.now(), existing.lastActiveAt),
    });
    return null;
  },
});

/** Only active conversation participants may publish ephemeral typing state.
 * The composer text, device or tab identity are intentionally not recorded. */
export const setTyping = mutation({
  args: { conversationId: v.id("conversations"), isTyping: v.boolean() },
  returns: v.null(),
  handler: async (ctx, { conversationId, isTyping }) => {
    const { me } = await requireConversationAccess(ctx, conversationId);
    const existing = await ctx.db.query("typingStates")
      .withIndex("by_conversation_profile",
        q => q.eq("conversationId", conversationId).eq("profileId", me._id)).unique();
    if (!isTyping || !me.presencePreferences.typingIndicators) {
      if (existing) await ctx.db.delete(existing._id);
      return null;
    }
    const now = Date.now();
    if (existing?.expiresAt && existing.expiresAt - now > TYPING_TTL_MS - TYPING_MIN_MS) return null;
    const value = { updatedAt: now, expiresAt: now + TYPING_TTL_MS };
    if (existing) await ctx.db.patch(existing._id, value);
    else await ctx.db.insert("typingStates", { conversationId, profileId: me._id, ...value });
    return null;
  },
});

/** Read pointers are derived exclusively from an existing authorized message.
 * This is monotonic and cannot be used to forge reads of future messages. */
export const markRead = mutation({
  args: { conversationId: v.id("conversations"), messageId: v.id("messages") },
  returns: v.null(),
  handler: async (ctx, { conversationId, messageId }) => {
    const access = await requireConversationAccess(ctx, conversationId);
    if (!access.me.presencePreferences.readReceipts) return null;
    const [message, membership] = await Promise.all([
      ctx.db.get(messageId),
      ctx.db.query("conversationMembers").withIndex("by_conversation_profile",
        q => q.eq("conversationId", conversationId).eq("profileId", access.me._id)).unique(),
    ]);
    if (!message || message.conversationId !== conversationId || !membership) return null;
    if (access.kind === "group" && message.createdAt <= membership.joinedAt) return null;
    if ((membership.readThroughAt ?? -1) >= message.createdAt) return null;
    await ctx.db.patch(membership._id, { readThroughAt: message.createdAt });
    return null;
  },
});

/** Stable, cacheable subscription; timestamps are expiry metadata, never
 * query arguments or server-side Date.now()-based display decisions. */
export const getConversationSignals = query({
  args: { conversationId: v.id("conversations") },
  returns: v.object({
    peerOnlineUntil: v.union(v.number(), v.null()),
    peerLastSeenAt: v.union(v.number(), v.null()),
    typing: v.array(v.object({
      profileId: v.id("profiles"), displayName: v.string(), expiresAt: v.number(),
    })),
    readBy: v.array(v.object({
      profileId: v.id("profiles"), displayName: v.string(), readThroughAt: v.number(),
    })),
  }),
  handler: async (ctx, { conversationId }) => {
    const access = await requireConversationAccess(ctx, conversationId);
    if (access.kind === "direct") {
      const { me, peer } = access;
      const [activity, typing, membership] = await Promise.all([
        ctx.db.query("profileActivity").withIndex("by_profile", q => q.eq("profileId", peer._id)).unique(),
        ctx.db.query("typingStates").withIndex("by_conversation_profile",
          q => q.eq("conversationId", conversationId).eq("profileId", peer._id)).unique(),
        ctx.db.query("conversationMembers").withIndex("by_conversation_profile",
          q => q.eq("conversationId", conversationId).eq("profileId", peer._id)).unique(),
      ]);
      return {
        peerOnlineUntil: peer.presencePreferences.onlineStatus
          ? Math.max(0, ...(activity?.sessions ?? []).map(session => session.lastActiveAt + PRESENCE_TTL_MS)) : null,
        peerLastSeenAt: peer.presencePreferences.lastSeen ? activity?.lastActiveAt ?? null : null,
        typing: peer.presencePreferences.typingIndicators && typing
          ? [{ profileId: peer._id, displayName: peer.displayName, expiresAt: typing.expiresAt }] : [],
        readBy: me.presencePreferences.readReceipts && peer.presencePreferences.readReceipts
          && membership?.readThroughAt !== undefined
          ? [{ profileId: peer._id, displayName: peer.displayName, readThroughAt: membership.readThroughAt }] : [],
      };
    }

    const memberships = await ctx.db.query("conversationMembers")
      .withIndex("by_conversation_profile", q => q.eq("conversationId", conversationId)).take(MAX_GROUP_MEMBERS);
    const others = memberships.filter(member => member.profileId !== access.me._id);
    const signals = await Promise.all(others.map(async membership => {
      const [peer, typing] = await Promise.all([
        ctx.db.get(membership.profileId),
        ctx.db.query("typingStates").withIndex("by_conversation_profile",
          q => q.eq("conversationId", conversationId).eq("profileId", membership.profileId)).unique(),
      ]);
      if (!peer || peer.status !== "active") return null;
      return {
        typing: peer.presencePreferences.typingIndicators && typing && typing.updatedAt >= membership.joinedAt
          ? { profileId: peer._id, displayName: peer.displayName, expiresAt: typing.expiresAt } : null,
        read: access.me.presencePreferences.readReceipts && peer.presencePreferences.readReceipts
          && membership.readThroughAt !== undefined && membership.readThroughAt > membership.joinedAt
          ? { profileId: peer._id, displayName: peer.displayName, readThroughAt: membership.readThroughAt } : null,
      };
    }));
    return {
      peerOnlineUntil: null,
      peerLastSeenAt: null,
      typing: signals.flatMap(x => x?.typing ? [x.typing] : []),
      readBy: signals.flatMap(x => x?.read ? [x.read] : []),
    };
  },
});
