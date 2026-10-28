import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuthorizedProfile } from "./lib/permissions";
import { assertDirectNotBlocked, requireConnectionParticipant, requireDirectConversation } from "./lib/directAccess";

export const openDirect = mutation({
  args: { connectionId: v.id("connections") },
  handler: async (ctx, { connectionId }) => {
    const { me, peer } = await requireConnectionParticipant(ctx, connectionId);
    await assertDirectNotBlocked(ctx, me._id, peer._id);
    const existing = await ctx.db.query("conversations")
      .withIndex("by_connection", q => q.eq("connectionId", connectionId)).unique();
    if (existing) return existing._id;
    const now = Date.now();
    const id = await ctx.db.insert("conversations", { kind: "direct", connectionId, createdAt: now, updatedAt: now });
    await ctx.db.insert("conversationMembers", { conversationId: id, profileId: me._id, joinedAt: now });
    await ctx.db.insert("conversationMembers", { conversationId: id, profileId: peer._id, joinedAt: now });
    return id;
  },
});

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const me = await requireAuthorizedProfile(ctx);
    const memberships = await ctx.db.query("conversationMembers")
      .withIndex("by_profile", q => q.eq("profileId", me._id)).take(100);
    const list = await Promise.all(memberships.map(async ({ conversationId }) => {
      const conversation = await ctx.db.get(conversationId);
      if (!conversation || conversation.kind !== "direct") return null;
      const connection = await ctx.db.get(conversation.connectionId);
      if (!connection || (connection.leftProfileId !== me._id && connection.rightProfileId !== me._id)) return null;
      const peerId = connection.leftProfileId === me._id ? connection.rightProfileId : connection.leftProfileId;
      const peer = await ctx.db.get(peerId);
      if (!peer || peer.status !== "active") return null;
      return { conversationId, connectionId: connection._id, peerId, displayName: peer.displayName,
        handle: peer.handle, updatedAt: conversation.updatedAt };
    }));
    return list.filter(item => item !== null).sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

export const getOne = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, { conversationId }) => {
    const { peer } = await requireDirectConversation(ctx, conversationId);
    return { conversationId, displayName: peer.displayName, handle: peer.handle, peerId: peer._id };
  },
});
