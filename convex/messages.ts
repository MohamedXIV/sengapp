import { ConvexError, v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { mutation, query } from "./_generated/server";
import { assertDirectNotBlocked, requireDirectConversation } from "./lib/directAccess";

const MAX_TEXT_LENGTH = 2_000;
const MAX_MESSAGES_PER_MINUTE = 30;

export const list = query({
  args: { conversationId: v.id("conversations"), paginationOpts: paginationOptsValidator },
  handler: async (ctx, { conversationId, paginationOpts }) => {
    await requireDirectConversation(ctx, conversationId);
    return ctx.db.query("messages")
      .withIndex("by_conversation_time", q => q.eq("conversationId", conversationId))
      .order("desc").paginate(paginationOpts);
  },
});

export const send = mutation({
  args: { conversationId: v.id("conversations"), body: v.string(), clientNonce: v.string() },
  handler: async (ctx, { conversationId, body, clientNonce }) => {
    const { me, peer } = await requireDirectConversation(ctx, conversationId);
    await assertDirectNotBlocked(ctx, me._id, peer._id);
    const normalized = body.trim();
    if (!normalized || normalized.length > MAX_TEXT_LENGTH || !/^[A-Za-z0-9_-]{16,80}$/.test(clientNonce)) {
      throw new ConvexError({ code: "INVALID_MESSAGE" });
    }
    const duplicate = await ctx.db.query("messages")
      .withIndex("by_sender_nonce", q => q.eq("senderProfileId", me._id).eq("clientNonce", clientNonce)).unique();
    if (duplicate) {
      if (duplicate.conversationId === conversationId && duplicate.body === normalized) return duplicate._id;
      throw new ConvexError({ code: "MESSAGE_NONCE_CONFLICT" });
    }
    const now = Date.now();
    const recent = await ctx.db.query("messages")
      .withIndex("by_sender_time", q => q.eq("senderProfileId", me._id).gte("createdAt", now - 60_000)).take(MAX_MESSAGES_PER_MINUTE);
    if (recent.length >= MAX_MESSAGES_PER_MINUTE) throw new ConvexError({ code: "MESSAGE_RATE_LIMIT" });
    const id = await ctx.db.insert("messages", {
      conversationId, senderProfileId: me._id, body: normalized, clientNonce, createdAt: now,
    });
    await ctx.db.patch(conversationId, { updatedAt: now });
    return id;
  },
});
