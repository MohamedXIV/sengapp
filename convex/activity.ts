import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuthorizedProfile } from "./lib/permissions";
import { assertDirectNotBlocked, requireDirectConversation } from "./lib/directAccess";
import { requireGroupMember } from "./lib/groupAccess";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

const PRESENCE_TTL_MS = 75_000;
const HEARTBEAT_MIN_MS = 20_000;
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

/** Called only while a signed-in, authorized member has the app in the foreground.
 * No explicit offline mutation: a hidden tab must not override another live tab. */
export const heartbeat = mutation({
  args: {},
  returns: v.null(),
  handler: async ctx => {
    const me = await requireAuthorizedProfile(ctx);
    if (!me.presencePreferences.onlineStatus && !me.presencePreferences.lastSeen) return null;
    const now = Date.now();
    const existing = await ctx.db.query("profileActivity")
      .withIndex("by_profile", q => q.eq("profileId", me._id)).unique();
    if (existing) {
      if (now - existing.lastActiveAt >= HEARTBEAT_MIN_MS) {
        await ctx.db.patch(existing._id, { lastActiveAt: now });
      }
    } else {
      await ctx.db.insert("profileActivity", { profileId: me._id, lastActiveAt: now });
    }
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

/** Server-scoped signals. Refreshing the query argument merely forces a
 * re-evaluation of TTLs; caller-supplied times NEVER determine visibility. */
export const getConversationSignals = query({
  args: { conversationId: v.id("conversations"), refreshToken: v.optional(v.number()) },
  returns: v.object({
    peerOnline: v.union(v.boolean(), v.null()),
    peerLastSeenAt: v.union(v.number(), v.null()),
    typing: v.array(v.object({ profileId: v.id("profiles"), displayName: v.string() })),
    readBy: v.array(v.object({ profileId: v.id("profiles"), displayName: v.string(), readThroughAt: v.number() })),
  }),
  handler: async (ctx, { conversationId }) => {
    const access = await requireConversationAccess(ctx, conversationId);
    const now = Date.now();
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
        peerOnline: peer.presencePreferences.onlineStatus ? Boolean(activity && now - activity.lastActiveAt < PRESENCE_TTL_MS) : null,
        peerLastSeenAt: peer.presencePreferences.lastSeen ? activity?.lastActiveAt ?? null : null,
        typing: peer.presencePreferences.typingIndicators && typing && typing.expiresAt > now
          ? [{ profileId: peer._id, displayName: peer.displayName }] : [],
        readBy: me.presencePreferences.readReceipts && peer.presencePreferences.readReceipts && membership?.readThroughAt !== undefined
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
        typing: peer.presencePreferences.typingIndicators && typing && typing.expiresAt > now
          && typing.updatedAt >= membership.joinedAt
          ? { profileId: peer._id, displayName: peer.displayName } : null,
        read: access.me.presencePreferences.readReceipts && peer.presencePreferences.readReceipts
          && membership.readThroughAt !== undefined && membership.readThroughAt > membership.joinedAt
          ? { profileId: peer._id, displayName: peer.displayName, readThroughAt: membership.readThroughAt } : null,
      };
    }));
    return {
      peerOnline: null,
      peerLastSeenAt: null,
      typing: signals.flatMap(x => x?.typing ? [x.typing] : []),
      readBy: signals.flatMap(x => x?.read ? [x.read] : []),
    };
  },
});
