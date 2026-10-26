import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Clerk owns authentication users and sessions outside Convex.
// These tables contain Sengapp membership data only.
export default defineSchema({
  profiles: defineTable({
    authUserId: v.string(),
    email: v.string(),
    displayName: v.string(),
    handle: v.optional(v.string()),
    role: v.union(v.literal("operator"), v.literal("member")),
    status: v.union(v.literal("active"), v.literal("suspended")),
    joinedAt: v.number(),
    updatedAt: v.number(),
    bio: v.optional(v.string()),
    statusMessage: v.optional(v.string()),
    avatarPresetKey: v.string(),
    avatarAccentColor: v.string(),
    locale: v.union(v.literal("en"), v.literal("ar")),
    textDirection: v.union(v.literal("ltr"), v.literal("rtl"), v.literal("auto")),
    themePreference: v.union(v.literal("light"), v.literal("dark"), v.literal("system")),
    reducedMotion: v.boolean(),
    presencePreferences: v.object({
      onlineStatus: v.boolean(),
      lastSeen: v.boolean(),
      readReceipts: v.boolean(),
      typingIndicators: v.boolean(),
    }),
    redeemedInvitationId: v.optional(v.id("invitations")),
  })
    .index("by_auth_user_id", ["authUserId"])
    .index("by_handle", ["handle"]),

  invitations: defineTable({
    codeHash: v.string(),
    codeHint: v.string(),
    issuedBy: v.id("profiles"),
    recipientEmail: v.optional(v.string()),
    note: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("redeemed"), v.literal("revoked")),
    createdAt: v.number(),
    expiresAt: v.number(),
    redeemedAt: v.optional(v.number()),
    redeemedBy: v.optional(v.id("profiles")),
    revokedAt: v.optional(v.number()),
  })
    .index("by_code_hash", ["codeHash"])
    .index("by_issued_by", ["issuedBy"])
    .index("by_issuer_status_expiry", ["issuedBy", "status", "expiresAt"]),

  auditLogs: defineTable({
    actorProfileId: v.optional(v.id("profiles")),
    action: v.string(),
    targetId: v.string(),
    createdAt: v.number(),
  }).index("by_actor", ["actorProfileId"]),
});
