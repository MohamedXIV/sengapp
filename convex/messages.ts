import { ConvexError, v } from "convex/values";
import { paginationOptsValidator, paginationResultValidator } from "convex/server";
import { mutation, query } from "./_generated/server";
import { assertDirectNotBlocked, requireDirectConversation } from "./lib/directAccess";
import { requireGroupMember } from "./lib/groupAccess";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

const MAX_TEXT_LENGTH = 2_000;
const MAX_MESSAGES_PER_MINUTE = 30;
const EDIT_WINDOW_MS = 15 * 60_000;
const MAX_REACTIONS_PER_MESSAGE = 64;
export const ALLOWED_REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🎉"] as const;

const messageValidator = v.object({
  _id: v.id("messages"), _creationTime: v.number(),
  conversationId: v.id("conversations"), senderProfileId: v.id("profiles"),
  body: v.string(), clientNonce: v.string(), createdAt: v.number(),
  replyToMessageId: v.optional(v.id("messages")),
  editedAt: v.optional(v.number()), deletedAt: v.optional(v.number()),
  reactions: v.optional(v.array(v.object({ profileId: v.id("profiles"), emoji: v.string() }))),
  replyPreview: v.optional(v.object({
    body: v.union(v.string(), v.null()),
    senderProfileId: v.union(v.id("profiles"), v.null()),
  })),
});

type DbCtx = QueryCtx | MutationCtx;

async function requireMessageAccess(ctx: DbCtx, conversationId: Id<"conversations">) {
  const conversation = await ctx.db.get(conversationId);
  if (conversation?.kind === "group") {
    const access = await requireGroupMember(ctx, conversationId);
    return { me: access.me, joinedAt: access.membership.joinedAt };
  }
  const access = await requireDirectConversation(ctx, conversationId);
  await assertDirectNotBlocked(ctx, access.me._id, access.peer._id);
  return { me: access.me, joinedAt: null };
}

async function requireMessage(ctx: MutationCtx, messageId: Id<"messages">) {
  const message = await ctx.db.get(messageId);
  if (!message) throw new ConvexError({ code: "MESSAGE_NOT_FOUND" });
  const access = await requireMessageAccess(ctx, message.conversationId);
  if (access.joinedAt !== null && message.createdAt <= access.joinedAt) {
    throw new ConvexError({ code: "MESSAGE_FORBIDDEN" });
  }
  return { message, me: access.me };
}

function validBody(body: string): string {
  const normalized = body.trim();
  if (!normalized || normalized.length > MAX_TEXT_LENGTH) {
    throw new ConvexError({ code: "INVALID_MESSAGE" });
  }
  return normalized;
}

export const list = query({
  args: { conversationId: v.id("conversations"), paginationOpts: paginationOptsValidator },
  returns: paginationResultValidator(messageValidator),
  handler: async (ctx, { conversationId, paginationOpts }) => {
    const access = await requireMessageAccess(ctx, conversationId);
    const baseQuery = ctx.db.query("messages").withIndex("by_conversation_time",
      q => q.eq("conversationId", conversationId));
    const page = access.joinedAt === null
      ? await baseQuery.order("desc").paginate(paginationOpts)
      : await ctx.db.query("messages").withIndex("by_conversation_time",
        q => q.eq("conversationId", conversationId).gt("createdAt", access.joinedAt!))
        .order("desc").paginate(paginationOpts);

    // Reply previews are resolved from today's access rules, not copied into
    // messages at send time. A deleted or pre-join target cannot leak its body.
    const items = await Promise.all(page.page.map(async message => {
      if (!message.replyToMessageId) return message;
      const target = await ctx.db.get(message.replyToMessageId);
      const visible = target && target.conversationId === conversationId
        && (access.joinedAt === null || target.createdAt > access.joinedAt);
      return { ...message, replyPreview: {
        body: visible && !target.deletedAt ? target.body.slice(0, 160) : null,
        senderProfileId: visible && !target.deletedAt ? target.senderProfileId : null,
      } };
    }));
    return { ...page, page: items };
  },
});

export const send = mutation({
  args: {
    conversationId: v.id("conversations"), body: v.string(), clientNonce: v.string(),
    replyToMessageId: v.optional(v.id("messages")),
  },
  returns: v.id("messages"),
  handler: async (ctx, { conversationId, body, clientNonce, replyToMessageId }) => {
    const access = await requireMessageAccess(ctx, conversationId);
    const normalized = validBody(body);
    if (!/^[A-Za-z0-9_-]{16,80}$/.test(clientNonce)) {
      throw new ConvexError({ code: "INVALID_MESSAGE" });
    }
    const duplicate = await ctx.db.query("messages").withIndex("by_sender_nonce",
      q => q.eq("senderProfileId", access.me._id).eq("clientNonce", clientNonce)).unique();
    if (duplicate) {
      if (duplicate.conversationId === conversationId && duplicate.body === normalized
          && duplicate.replyToMessageId === replyToMessageId) return duplicate._id;
      throw new ConvexError({ code: "MESSAGE_NONCE_CONFLICT" });
    }

    if (replyToMessageId) {
      const target = await ctx.db.get(replyToMessageId);
      if (!target || target.conversationId !== conversationId || target.deletedAt
          || (access.joinedAt !== null && target.createdAt <= access.joinedAt)) {
        throw new ConvexError({ code: "REPLY_TARGET_UNAVAILABLE" });
      }
    }

    const now = Date.now();
    const recent = await ctx.db.query("messages").withIndex("by_sender_time",
      q => q.eq("senderProfileId", access.me._id).gte("createdAt", now - 60_000))
      .take(MAX_MESSAGES_PER_MINUTE);
    if (recent.length >= MAX_MESSAGES_PER_MINUTE) {
      throw new ConvexError({ code: "MESSAGE_RATE_LIMIT" });
    }
    const conversation = await ctx.db.get(conversationId);
    const messageTime = Math.max(now, (conversation?.updatedAt ?? now) + 1);
    const id = await ctx.db.insert("messages", {
      conversationId, senderProfileId: access.me._id, body: normalized,
      clientNonce, createdAt: messageTime, ...(replyToMessageId ? { replyToMessageId } : {}),
    });
    await ctx.db.patch(conversationId, { updatedAt: messageTime });
    return id;
  },
});

export const edit = mutation({
  args: { messageId: v.id("messages"), body: v.string() },
  returns: v.null(),
  handler: async (ctx, { messageId, body }) => {
    const { message, me } = await requireMessage(ctx, messageId);
    if (message.senderProfileId !== me._id) throw new ConvexError({ code: "MESSAGE_FORBIDDEN" });
    if (message.deletedAt) throw new ConvexError({ code: "MESSAGE_DELETED" });
    const now = Date.now();
    if (now > message.createdAt + EDIT_WINDOW_MS) throw new ConvexError({ code: "EDIT_WINDOW_EXPIRED" });
    const normalized = validBody(body);
    if (message.body !== normalized) await ctx.db.patch(messageId, { body: normalized, editedAt: Math.max(now, message.createdAt) });
    return null;
  },
});

export const remove = mutation({
  args: { messageId: v.id("messages") },
  returns: v.null(),
  handler: async (ctx, { messageId }) => {
    const { message, me } = await requireMessage(ctx, messageId);
    if (message.senderProfileId !== me._id) throw new ConvexError({ code: "MESSAGE_FORBIDDEN" });
    if (message.deletedAt) return null;
    // A tombstone keeps ordering and older replies intact, without retaining
    // the message text or reactions in the active record.
    await ctx.db.patch(messageId, { body: "", reactions: [], deletedAt: Math.max(Date.now(), message.createdAt) });
    return null;
  },
});

export const toggleReaction = mutation({
  args: { messageId: v.id("messages"), emoji: v.string() },
  returns: v.null(),
  handler: async (ctx, { messageId, emoji }) => {
    const { message, me } = await requireMessage(ctx, messageId);
    if (message.deletedAt) throw new ConvexError({ code: "MESSAGE_DELETED" });
    if (!(ALLOWED_REACTIONS as readonly string[]).includes(emoji)) {
      throw new ConvexError({ code: "INVALID_REACTION" });
    }
    const existing = message.reactions ?? [];
    const prior = existing.find(reaction => reaction.profileId === me._id);
    const next = existing.filter(reaction => reaction.profileId !== me._id);
    if (prior?.emoji !== emoji) {
      if (next.length >= MAX_REACTIONS_PER_MESSAGE) {
        throw new ConvexError({ code: "REACTION_LIMIT" });
      }
      next.push({ profileId: me._id, emoji });
    }
    await ctx.db.patch(messageId, { reactions: next });
    return null;
  },
});
