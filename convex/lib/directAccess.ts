import { ConvexError } from "convex/values";
import type { Id } from "../_generated/dataModel";
import type { QueryCtx, MutationCtx } from "../_generated/server";
import { requireAuthorizedProfile } from "./permissions";

type DbCtx = QueryCtx | MutationCtx;

export async function requireConnectionParticipant(ctx: DbCtx, connectionId: Id<"connections">) {
  const me = await requireAuthorizedProfile(ctx);
  const connection = await ctx.db.get(connectionId);
  if (!connection || (connection.leftProfileId !== me._id && connection.rightProfileId !== me._id)) {
    throw new ConvexError({ code: "CONVERSATION_FORBIDDEN" });
  }
  const peerId = connection.leftProfileId === me._id ? connection.rightProfileId : connection.leftProfileId;
  const peer = await ctx.db.get(peerId);
  if (!peer || peer.status !== "active") throw new ConvexError({ code: "PEER_UNAVAILABLE" });
  return { me, peer, connection };
}

export async function assertDirectNotBlocked(ctx: DbCtx, a: Id<"profiles">, b: Id<"profiles">) {
  const [forward, reverse] = await Promise.all([
    ctx.db.query("blocks").withIndex("by_pair", q => q.eq("blockerProfileId", a).eq("blockedProfileId", b)).unique(),
    ctx.db.query("blocks").withIndex("by_pair", q => q.eq("blockerProfileId", b).eq("blockedProfileId", a)).unique(),
  ]);
  if (forward || reverse) throw new ConvexError({ code: "CONVERSATION_BLOCKED" });
}

export async function requireDirectConversation(ctx: DbCtx, conversationId: Id<"conversations">) {
  const me = await requireAuthorizedProfile(ctx);
  const conversation = await ctx.db.get(conversationId);
  if (!conversation || conversation.kind !== "direct") throw new ConvexError({ code: "CONVERSATION_FORBIDDEN" });
  const membership = await ctx.db.query("conversationMembers")
    .withIndex("by_conversation_profile", q => q.eq("conversationId", conversationId).eq("profileId", me._id)).unique();
  if (!membership) throw new ConvexError({ code: "CONVERSATION_FORBIDDEN" });
  const participants = await requireConnectionParticipant(ctx, conversation.connectionId);
  return { ...participants, conversation };
}
