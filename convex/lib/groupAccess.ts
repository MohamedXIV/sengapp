import { ConvexError } from "convex/values";
import type { Id } from "../_generated/dataModel";
import type { QueryCtx, MutationCtx } from "../_generated/server";
import { requireAuthorizedProfile } from "./permissions";

type DbCtx = QueryCtx | MutationCtx;
export type GroupRole = "owner" | "admin" | "member";

export async function requireGroupMember(ctx: DbCtx, conversationId: Id<"conversations">) {
  const me = await requireAuthorizedProfile(ctx);
  const conversation = await ctx.db.get(conversationId);
  if (!conversation || conversation.kind !== "group" || !conversation.groupName || !conversation.ownerProfileId) {
    throw new ConvexError({ code: "GROUP_FORBIDDEN" });
  }
  const membership = await ctx.db.query("conversationMembers")
    .withIndex("by_conversation_profile", q => q.eq("conversationId", conversationId).eq("profileId", me._id)).unique();
  if (!membership?.role) throw new ConvexError({ code: "GROUP_FORBIDDEN" });
  return { me, conversation, membership, role: membership.role };
}

export async function requireGroupAdmin(ctx: DbCtx, conversationId: Id<"conversations">) {
  const group = await requireGroupMember(ctx, conversationId);
  if (group.role === "member") throw new ConvexError({ code: "GROUP_ADMIN_REQUIRED" });
  return group;
}
