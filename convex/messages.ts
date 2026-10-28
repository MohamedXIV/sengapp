import { ConvexError, v } from "convex/values";
import { paginationOptsValidator, paginationResultValidator } from "convex/server";
import { mutation, query } from "./_generated/server";
import { assertDirectNotBlocked, requireDirectConversation } from "./lib/directAccess";
import { requireGroupMember } from "./lib/groupAccess";

const MAX_TEXT_LENGTH = 2_000;
const MAX_MESSAGES_PER_MINUTE = 30;
const messageValidator = v.object({
  _id: v.id("messages"), _creationTime: v.number(), conversationId: v.id("conversations"),
  senderProfileId: v.id("profiles"), body: v.string(), clientNonce: v.string(), createdAt: v.number(),
});

export const list = query({
  args: { conversationId: v.id("conversations"), paginationOpts: paginationOptsValidator },
  returns: paginationResultValidator(messageValidator),
  handler: async (ctx, { conversationId, paginationOpts }) => {
    const conversation = await ctx.db.get(conversationId);
    if (conversation?.kind === "group") {
      const { membership } = await requireGroupMember(ctx, conversationId);
      // A joined-at cutoff remains enforced on every query/subscription and pagination page.
      return ctx.db.query("messages").withIndex("by_conversation_time",
        q => q.eq("conversationId", conversationId).gt("createdAt", membership.joinedAt))
        .order("desc").paginate(paginationOpts);
    }
    await requireDirectConversation(ctx, conversationId);
    return ctx.db.query("messages").withIndex("by_conversation_time",
      q => q.eq("conversationId", conversationId)).order("desc").paginate(paginationOpts);
  },
});

export const send = mutation({
  args: { conversationId: v.id("conversations"), body: v.string(), clientNonce: v.string() },
  returns: v.id("messages"),
  handler: async (ctx, { conversationId, body, clientNonce }) => {
    const conversation = await ctx.db.get(conversationId);
    let senderId;
    if (conversation?.kind === "group") {
      senderId = (await requireGroupMember(ctx, conversationId)).me._id;
    } else {
      const { me, peer } = await requireDirectConversation(ctx, conversationId);
      await assertDirectNotBlocked(ctx, me._id, peer._id);
      senderId = me._id;
    }
    const normalized = body.trim();
    if (!normalized || normalized.length > MAX_TEXT_LENGTH || !/^[A-Za-z0-9_-]{16,80}$/.test(clientNonce)) {
      throw new ConvexError({ code: "INVALID_MESSAGE" });
    }
    const duplicate = await ctx.db.query("messages")
      .withIndex("by_sender_nonce", q => q.eq("senderProfileId", senderId).eq("clientNonce", clientNonce)).unique();
    if (duplicate) {
      if (duplicate.conversationId === conversationId && duplicate.body === normalized) return duplicate._id;
      throw new ConvexError({ code: "MESSAGE_NONCE_CONFLICT" });
    }
    const now = Date.now();
    const recent = await ctx.db.query("messages")
      .withIndex("by_sender_time", q => q.eq("senderProfileId", senderId).gte("createdAt", now - 60_000)).take(MAX_MESSAGES_PER_MINUTE);
    if (recent.length >= MAX_MESSAGES_PER_MINUTE) throw new ConvexError({ code: "MESSAGE_RATE_LIMIT" });
    const messageTime = conversation?.kind === "group" ? Math.max(now, conversation.updatedAt + 1) : now;
    const id = await ctx.db.insert("messages", {
      conversationId, senderProfileId: senderId, body: normalized, clientNonce, createdAt: messageTime,
    });
    await ctx.db.patch(conversationId, { updatedAt: messageTime });
    return id;
  },
});

