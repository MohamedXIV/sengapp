import { ConvexError, v } from "convex/values";
import { internalQuery, mutation, query } from "./_generated/server";
import { requireAuthorizedProfile } from "./lib/permissions";
import {
  denyCompanion, mentionedCompanion, readCompanionScope,
  requireCallerInConversation, sameConsentSnapshot,
} from "./lib/companionPolicy";
import type { Doc } from "./_generated/dataModel";

const MAX_REQUESTS_PER_DAY = 20;
const NONCE_PATTERN = /^[A-Za-z0-9_-]{16,80}$/;

function assertSourceMessage(
  message: Doc<"messages"> | null,
  requesterProfileId: Doc<"profiles">["_id"],
  conversationId: Doc<"conversations">["_id"],
  handle: string,
  joinedAt: number | null,
): asserts message is Doc<"messages"> {
  if (!message || message.conversationId !== conversationId
      || message.senderProfileId !== requesterProfileId || message.deletedAt
      || (joinedAt !== null && message.createdAt <= joinedAt)
      || !mentionedCompanion(message.body, handle)) {
    return denyCompanion();
  }
}

/**
 * Preflight only: creates a validation record, not an AI job. Real dispatch
 * must call contextForDispatch immediately before passing anything to an LLM.
 */
export const request = mutation({
  args: {
    conversationId: v.id("conversations"),
    companionId: v.id("companions"),
    sourceMessageId: v.id("messages"),
    clientNonce: v.string(),
  },
  returns: v.id("companionInvocations"),
  handler: async (ctx, { conversationId, companionId, sourceMessageId, clientNonce }) => {
    const me = await requireCallerInConversation(ctx, conversationId);
    if (!NONCE_PATTERN.test(clientNonce)) throw new ConvexError({ code: "INVALID_COMPANION_NONCE" });
    const scope = await readCompanionScope(ctx, conversationId, companionId);
    if (scope.companion.ownerProfileId !== me._id || scope.companion.status !== "active"
        || !scope.snapshot) return denyCompanion();

    const membership = scope.memberships.find(row => row.profileId === me._id);
    if (!membership) return denyCompanion();
    const source = await ctx.db.get(sourceMessageId);
    assertSourceMessage(source, me._id, conversationId, scope.companion.handle,
      scope.conversation.kind === "group" ? membership.joinedAt : null);

    // Re-validate authorization BEFORE even returning an idempotent prior result.
    const duplicate = await ctx.db.query("companionInvocations")
      .withIndex("by_requester_nonce", q => q.eq("requesterProfileId", me._id).eq("clientNonce", clientNonce))
      .unique();
    if (duplicate) {
      if (duplicate.conversationId === conversationId && duplicate.companionId === companionId
          && duplicate.sourceMessageId === sourceMessageId) return duplicate._id;
      throw new ConvexError({ code: "COMPANION_NONCE_CONFLICT" });
    }
    const now = Date.now();
    const recent = await ctx.db.query("companionInvocations")
      .withIndex("by_requester_time", q => q.eq("requesterProfileId", me._id).gte("createdAt", now - 86_400_000))
      .take(MAX_REQUESTS_PER_DAY);
    if (recent.length >= MAX_REQUESTS_PER_DAY) throw new ConvexError({ code: "COMPANION_RATE_LIMIT" });

    return ctx.db.insert("companionInvocations", {
      conversationId, companionId, sourceMessageId, requesterProfileId: me._id,
      ...(source.editedAt === undefined ? {} : { sourceEditedAt: source.editedAt }),
      clientNonce, companionRevision: scope.companion.revision,
      consents: scope.snapshot, status: "validated", createdAt: now,
    });
  },
});

export const cancel = mutation({
  args: { invocationId: v.id("companionInvocations") },
  returns: v.null(),
  handler: async (ctx, { invocationId }) => {
    const me = await requireAuthorizedProfile(ctx);
    const invocation = await ctx.db.get(invocationId);
    if (!invocation || invocation.requesterProfileId !== me._id) return denyCompanion();
    if (invocation.status !== "cancelled") {
      await ctx.db.patch(invocationId, { status: "cancelled", cancelledAt: Date.now() });
    }
    return null;
  },
});

export const listMine = query({
  args: {},
  returns: v.array(v.object({
    invocationId: v.id("companionInvocations"),
    companionId: v.id("companions"),
    status: v.union(v.literal("validated"), v.literal("cancelled")),
    createdAt: v.number(),
  })),
  handler: async ctx => {
    const me = await requireAuthorizedProfile(ctx);
    const items = await ctx.db.query("companionInvocations")
      .withIndex("by_requester_time", q => q.eq("requesterProfileId", me._id))
      .order("desc").take(30);
    // No message body or private context in a public query.
    return items.map(item => ({
      invocationId: item._id, companionId: item.companionId,
      status: item.status, createdAt: item.createdAt,
    }));
  },
});

/**
 * Internal-only context read for a FUTURE dispatch action. Never invoked on
 * request(). Checks current group members, blocks, profile statuses, every
 * consent revision, owner activation and source edit/delete before releasing
 * ONLY the triggering message. No history, RAG, memory or other conversations.
 */
export const contextForDispatch = internalQuery({
  args: { invocationId: v.id("companionInvocations") },
  returns: v.union(v.null(), v.object({
    invocationId: v.id("companionInvocations"),
    conversationId: v.id("conversations"),
    companionId: v.id("companions"),
    requesterProfileId: v.id("profiles"),
    sourceMessageId: v.id("messages"),
    text: v.string(),
  })),
  handler: async (ctx, { invocationId }) => {
    const invocation = await ctx.db.get(invocationId);
    if (!invocation || invocation.status !== "validated") return null;
    try {
      const scope = await readCompanionScope(ctx, invocation.conversationId, invocation.companionId);
      if (scope.companion.status !== "active"
          || scope.companion.ownerProfileId !== invocation.requesterProfileId
          || scope.companion.revision !== invocation.companionRevision
          || !scope.snapshot || !sameConsentSnapshot(scope.snapshot, invocation.consents)) return null;
      const membership = scope.memberships.find(row => row.profileId === invocation.requesterProfileId);
      if (!membership) return null;
      const source = await ctx.db.get(invocation.sourceMessageId);
      assertSourceMessage(source, invocation.requesterProfileId, invocation.conversationId,
        scope.companion.handle, scope.conversation.kind === "group" ? membership.joinedAt : null);
      if (source.editedAt !== invocation.sourceEditedAt) return null;
      return {
        invocationId: invocation._id, conversationId: invocation.conversationId,
        companionId: invocation.companionId, requesterProfileId: invocation.requesterProfileId,
        sourceMessageId: source._id, text: source.body,
      };
    } catch (error) {
      // Expected loss of access must fail closed; unexpected DB/programming
      // failures should surface, not masquerade as a permission denial.
      if (error instanceof ConvexError) return null;
      throw error;
    }
  },
});
