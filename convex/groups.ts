import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuthorizedProfile } from "./lib/permissions";
import { requireGroupAdmin, requireGroupMember } from "./lib/groupAccess";
import { canonicalPair } from "./lib/connectionPolicy";
import { assertDirectNotBlocked } from "./lib/directAccess";
import type { Id } from "./_generated/dataModel";
import type { QueryCtx, MutationCtx } from "./_generated/server";

const MAX_GROUP_NAME = 60;
const MAX_GROUP_MEMBERS = 32;

async function requireConnectedContact(ctx: QueryCtx | MutationCtx, me: Id<"profiles">, peer: Id<"profiles">) {
  if (me === peer) throw new ConvexError({ code: "GROUP_INVITE_FORBIDDEN" });
  const [left, right] = canonicalPair(me, peer) as [Id<"profiles">, Id<"profiles">];
  const [connection, profile] = await Promise.all([
    ctx.db.query("connections").withIndex("by_pair", q => q.eq("leftProfileId", left).eq("rightProfileId", right)).unique(),
    ctx.db.get(peer),
  ]);
  if (!connection || profile?.status !== "active") throw new ConvexError({ code: "GROUP_INVITE_FORBIDDEN" });
  await assertDirectNotBlocked(ctx, me, peer);
}

export const create = mutation({
  args: { name: v.string() },
  returns: v.id("conversations"),
  handler: async (ctx, { name }) => {
    const me = await requireAuthorizedProfile(ctx);
    const normalized = name.trim();
    if (!normalized || normalized.length > MAX_GROUP_NAME) throw new ConvexError({ code: "INVALID_GROUP_NAME" });
    const now = Date.now();
    const recent = await ctx.db.query("conversations")
      .withIndex("by_owner_created", q => q.eq("ownerProfileId", me._id).gte("createdAt", now - 86_400_000))
      .take(10);
    if (recent.length >= 10) throw new ConvexError({ code: "GROUP_RATE_LIMIT" });
    const id = await ctx.db.insert("conversations", {
      kind: "group", groupName: normalized, ownerProfileId: me._id, createdAt: now, updatedAt: now,
    });
    await ctx.db.insert("conversationMembers", { conversationId: id, profileId: me._id, role: "owner", joinedAt: now });
    return id;
  },
});

const memberValidator = v.object({
  profileId: v.id("profiles"), displayName: v.string(), role: v.union(v.literal("owner"), v.literal("admin"), v.literal("member")),
});

export const getDetails = query({
  args: { conversationId: v.id("conversations") },
  returns: v.object({
    name: v.string(), role: v.union(v.literal("owner"), v.literal("admin"), v.literal("member")),
    members: v.array(memberValidator),
  }),
  handler: async (ctx, { conversationId }) => {
    const { conversation, role } = await requireGroupMember(ctx, conversationId);
    const memberships = await ctx.db.query("conversationMembers")
      .withIndex("by_conversation_profile", q => q.eq("conversationId", conversationId)).take(33);
    const members = await Promise.all(memberships.map(async membership => {
      const profile = await ctx.db.get(membership.profileId);
      return profile && membership.role ? { profileId: profile._id, displayName: profile.displayName, role: membership.role } : null;
    }));
    return { name: conversation.groupName!, role, members: members.filter(member => member !== null) };
  },
});

export const inviteMember = mutation({
  args: { conversationId: v.id("conversations"), profileId: v.id("profiles") },
  returns: v.id("groupInvites"),
  handler: async (ctx, { conversationId, profileId }) => {
    const { me } = await requireGroupAdmin(ctx, conversationId);
    await requireConnectedContact(ctx, me._id, profileId);
    const [existing, members] = await Promise.all([
      ctx.db.query("conversationMembers").withIndex("by_conversation_profile",
        q => q.eq("conversationId", conversationId).eq("profileId", profileId)).unique(),
      ctx.db.query("conversationMembers").withIndex("by_conversation_profile",
        q => q.eq("conversationId", conversationId)).take(MAX_GROUP_MEMBERS),
    ]);
    if (existing || members.length >= MAX_GROUP_MEMBERS) throw new ConvexError({ code: "GROUP_INVITE_FORBIDDEN" });
    const pending = await ctx.db.query("groupInvites").withIndex("by_conversation_invitee",
      q => q.eq("conversationId", conversationId).eq("invitedProfileId", profileId)).order("desc").first();
    if (pending?.status === "pending") throw new ConvexError({ code: "GROUP_INVITE_ALREADY_PENDING" });
    const now = Date.now();
    const recent = await ctx.db.query("groupInvites").withIndex("by_inviter_created",
      q => q.eq("invitedBy", me._id).gte("createdAt", now - 86_400_000)).take(50);
    if (recent.length >= 50) throw new ConvexError({ code: "GROUP_INVITE_RATE_LIMIT" });
    return ctx.db.insert("groupInvites", {
      conversationId, invitedProfileId: profileId, invitedBy: me._id, status: "pending", createdAt: now,
    });
  },
});

export const listInvitesMine = query({
  args: {},
  returns: v.array(v.object({
    inviteId: v.id("groupInvites"), conversationId: v.id("conversations"),
    groupName: v.string(), inviterName: v.string(),
  })),
  handler: async ctx => {
    const me = await requireAuthorizedProfile(ctx);
    const invites = await ctx.db.query("groupInvites").withIndex("by_invited_status",
      q => q.eq("invitedProfileId", me._id).eq("status", "pending")).take(100);
    const items = await Promise.all(invites.map(async invite => {
      const [conversation, inviter] = await Promise.all([
        ctx.db.get(invite.conversationId), ctx.db.get(invite.invitedBy),
      ]);
      return conversation?.kind === "group" && conversation.groupName && inviter?.status === "active"
        ? { inviteId: invite._id, conversationId: conversation._id,
            groupName: conversation.groupName, inviterName: inviter.displayName }
        : null;
    }));
    return items.filter(item => item !== null);
  },
});

export const acceptInvite = mutation({
  args: { inviteId: v.id("groupInvites") },
  returns: v.id("conversations"),
  handler: async (ctx, { inviteId }) => {
    const me = await requireAuthorizedProfile(ctx);
    const invite = await ctx.db.get(inviteId);
    if (!invite || invite.status !== "pending" || invite.invitedProfileId !== me._id) {
      throw new ConvexError({ code: "GROUP_INVITE_FORBIDDEN" });
    }
    const conversation = await ctx.db.get(invite.conversationId);
    if (!conversation || conversation.kind !== "group") throw new ConvexError({ code: "GROUP_INVITE_FORBIDDEN" });
    const inviterMember = await ctx.db.query("conversationMembers").withIndex("by_conversation_profile",
      q => q.eq("conversationId", invite.conversationId).eq("profileId", invite.invitedBy)).unique();
    if (!inviterMember || inviterMember.role === "member") throw new ConvexError({ code: "GROUP_INVITE_FORBIDDEN" });
    await requireConnectedContact(ctx, invite.invitedBy, me._id);
    const [existing, members] = await Promise.all([
      ctx.db.query("conversationMembers").withIndex("by_conversation_profile",
        q => q.eq("conversationId", invite.conversationId).eq("profileId", me._id)).unique(),
      ctx.db.query("conversationMembers").withIndex("by_conversation_profile",
        q => q.eq("conversationId", invite.conversationId)).take(MAX_GROUP_MEMBERS),
    ]);
    if (existing || members.length >= MAX_GROUP_MEMBERS) throw new ConvexError({ code: "GROUP_INVITE_FORBIDDEN" });
    const now = Math.max(Date.now(), conversation.updatedAt + 1);
    await ctx.db.insert("conversationMembers", { conversationId: invite.conversationId,
      profileId: me._id, role: "member", joinedAt: now });
    await ctx.db.patch(inviteId, { status: "accepted", respondedAt: now });
    await ctx.db.patch(invite.conversationId, { updatedAt: now });
    return invite.conversationId;
  },
});

export const declineInvite = mutation({
  args: { inviteId: v.id("groupInvites") },
  returns: v.null(),
  handler: async (ctx, { inviteId }) => {
    const me = await requireAuthorizedProfile(ctx);
    const invite = await ctx.db.get(inviteId);
    if (!invite || invite.invitedProfileId !== me._id || invite.status !== "pending") {
      throw new ConvexError({ code: "GROUP_INVITE_FORBIDDEN" });
    }
    await ctx.db.patch(inviteId, { status: "declined", respondedAt: Date.now() });
    return null;
  },
});

export const rename = mutation({
  args: { conversationId: v.id("conversations"), name: v.string() },
  returns: v.null(),
  handler: async (ctx, { conversationId, name }) => {
    await requireGroupAdmin(ctx, conversationId);
    const normalized = name.trim();
    if (!normalized || normalized.length > MAX_GROUP_NAME) throw new ConvexError({ code: "INVALID_GROUP_NAME" });
    await ctx.db.patch(conversationId, { groupName: normalized, updatedAt: Date.now() });
    return null;
  },
});

export const setRole = mutation({
  args: { conversationId: v.id("conversations"), profileId: v.id("profiles"),
    role: v.union(v.literal("admin"), v.literal("member")) },
  returns: v.null(),
  handler: async (ctx, { conversationId, profileId, role }) => {
    const group = await requireGroupMember(ctx, conversationId);
    if (group.role !== "owner" || group.me._id === profileId) throw new ConvexError({ code: "GROUP_OWNER_REQUIRED" });
    const target = await ctx.db.query("conversationMembers").withIndex("by_conversation_profile",
      q => q.eq("conversationId", conversationId).eq("profileId", profileId)).unique();
    if (!target || target.role === "owner") throw new ConvexError({ code: "GROUP_FORBIDDEN" });
    await ctx.db.patch(target._id, { role });
    return null;
  },
});

export const removeMember = mutation({
  args: { conversationId: v.id("conversations"), profileId: v.id("profiles") },
  returns: v.null(),
  handler: async (ctx, { conversationId, profileId }) => {
    const group = await requireGroupAdmin(ctx, conversationId);
    if (group.me._id === profileId) throw new ConvexError({ code: "GROUP_FORBIDDEN" });
    const target = await ctx.db.query("conversationMembers").withIndex("by_conversation_profile",
      q => q.eq("conversationId", conversationId).eq("profileId", profileId)).unique();
    if (!target || target.role === "owner" || (group.role === "admin" && target.role !== "member")) {
      throw new ConvexError({ code: "GROUP_FORBIDDEN" });
    }
    await ctx.db.delete(target._id);
    return null;
  },
});

export const leave = mutation({
  args: { conversationId: v.id("conversations") },
  returns: v.null(),
  handler: async (ctx, { conversationId }) => {
    const group = await requireGroupMember(ctx, conversationId);
    if (group.role === "owner") throw new ConvexError({ code: "GROUP_OWNER_CANNOT_LEAVE" });
    await ctx.db.delete(group.membership._id);
    return null;
  },
});
