import { ConvexError } from "convex/values";
import type { Id } from "../_generated/dataModel";
import type { QueryCtx, MutationCtx } from "../_generated/server";
import { assertDirectNotBlocked, requireDirectConversation } from "./directAccess";
import { requireGroupMember } from "./groupAccess";

type DbCtx = QueryCtx | MutationCtx;
export const MAX_COMPANION_MEMBERS = 32;

export type ConsentSnapshot = {
  profileId: Id<"profiles">;
  membershipJoinedAt: number;
  revision: number;
};

export function denyCompanion(): never {
  throw new ConvexError({ code: "COMPANION_FORBIDDEN" });
}

/** Public entry points must apply the established Clerk/DM/group membership guards. */
export async function requireCallerInConversation(ctx: DbCtx, conversationId: Id<"conversations">) {
  const conversation = await ctx.db.get(conversationId);
  if (conversation?.kind === "group") {
    const access = await requireGroupMember(ctx, conversationId);
    return access.me;
  }
  const access = await requireDirectConversation(ctx, conversationId);
  await assertDirectNotBlocked(ctx, access.me._id, access.peer._id);
  return access.me;
}

/**
 * Authorization shared by mutation preflight and INTERNAL dispatch preflight.
 * The internal query has no Clerk identity, so it validates current database
 * membership, active profiles, direct connections and block state afresh.
 * This function returns no user messages, only consent revision snapshots.
 */
export async function readCompanionScope(
  ctx: DbCtx,
  conversationId: Id<"conversations">,
  companionId: Id<"companions">,
) {
  const [conversation, companion] = await Promise.all([
    ctx.db.get(conversationId),
    ctx.db.get(companionId),
  ]);
  if (!conversation || !companion) return denyCompanion();
  const memberships = await ctx.db.query("conversationMembers")
    .withIndex("by_conversation_profile", q => q.eq("conversationId", conversationId))
    .take(MAX_COMPANION_MEMBERS + 1);
  if (!memberships.length || memberships.length > MAX_COMPANION_MEMBERS) return denyCompanion();

  const ownerMembership = memberships.find(row => row.profileId === companion.ownerProfileId);
  if (!ownerMembership) return denyCompanion();
  const profiles = await Promise.all(memberships.map(row => ctx.db.get(row.profileId)));
  if (profiles.some(profile => !profile || profile.status !== "active")) return denyCompanion();

  if (conversation.kind === "group") {
    if (!conversation.groupName || !conversation.ownerProfileId
        || memberships.some(member => !member.role)) return denyCompanion();
    // A blocked owner must never receive any participant's words via an agent.
    for (const member of memberships) {
      if (member.profileId !== companion.ownerProfileId) {
        await assertDirectNotBlocked(ctx, companion.ownerProfileId, member.profileId);
      }
    }
  } else {
    if (!conversation.connectionId || memberships.length !== 2) return denyCompanion();
    const connection = await ctx.db.get(conversation.connectionId);
    if (!connection || !memberships.some(row => row.profileId === connection.leftProfileId)
        || !memberships.some(row => row.profileId === connection.rightProfileId)) return denyCompanion();
    await assertDirectNotBlocked(ctx, connection.leftProfileId, connection.rightProfileId);
  }

  const consents = await Promise.all(memberships.map(member =>
    ctx.db.query("companionConsents")
      .withIndex("by_conversation_companion_profile",
        q => q.eq("conversationId", conversationId)
          .eq("companionId", companionId).eq("profileId", member.profileId))
      .unique(),
  ));
  const grantedCount = consents.filter((consent, i) =>
    consent?.granted === true && consent.membershipJoinedAt === memberships[i]!.joinedAt).length;
  const approved = grantedCount === memberships.length;
  const snapshot: ConsentSnapshot[] | null = approved
    ? memberships.map((member, i) => ({
        profileId: member.profileId,
        membershipJoinedAt: member.joinedAt,
        revision: consents[i]!.revision,
      })).sort((a, b) => String(a.profileId).localeCompare(String(b.profileId)))
    : null;

  return { companion, conversation, memberships, snapshot, grantedCount, approved };
}

export function sameConsentSnapshot(a: readonly ConsentSnapshot[], b: readonly ConsentSnapshot[]) {
  return a.length === b.length && a.every((entry, i) => {
    const other = b[i];
    return other?.profileId === entry.profileId
      && other.membershipJoinedAt === entry.membershipJoinedAt
      && other.revision === entry.revision;
  });
}

export function mentionedCompanion(text: string, handle: string) {
  // Handles are server-validated ASCII alphanumeric/underscore; no regex escape required.
  return new RegExp("(?:^|\\s)@" + handle + "(?=$|\\s|[,.!?])", "i").test(text);
}
