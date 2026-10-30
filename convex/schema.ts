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
    handleChangedAt: v.optional(v.number()),
    displayNameSource: v.optional(v.union(v.literal("provider"), v.literal("fallback"), v.literal("user"))),
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
    visualPreferences: v.optional(v.object({
      preset: v.union(v.literal("acorn"), v.literal("forest"), v.literal("dusk"), v.literal("ocean")),
      accent: v.union(v.literal("amber"), v.literal("coral"), v.literal("sage"), v.literal("teal"), v.literal("blue"), v.literal("violet")),
      font: v.union(v.literal("system"), v.literal("inter"), v.literal("nunito")),
      radius: v.union(v.literal("subtle"), v.literal("soft"), v.literal("round")),
      density: v.union(v.literal("comfortable"), v.literal("compact")),
    })),
    reducedMotion: v.boolean(),
    presencePreferences: v.object({
      onlineStatus: v.boolean(),
      lastSeen: v.boolean(),
      readReceipts: v.boolean(),
      typingIndicators: v.boolean(),
    }),
  })
    .index("by_auth_user_id", ["authUserId"])
    .index("by_handle", ["handle"]),

  connectionInvites: defineTable({
    codeHash: v.string(),
    codeHint: v.string(),
    issuedBy: v.id("profiles"),
    recipientEmail: v.optional(v.string()),
    note: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("declined"), v.literal("revoked")),
    createdAt: v.number(),
    expiresAt: v.number(),
    acceptedAt: v.optional(v.number()),
    acceptedBy: v.optional(v.id("profiles")),
    declinedAt: v.optional(v.number()),
    declinedBy: v.optional(v.id("profiles")),
    revokedAt: v.optional(v.number()),
  })
    .index("by_code_hash", ["codeHash"])
    .index("by_issued_by", ["issuedBy"])
    .index("by_issuer_status_expiry", ["issuedBy", "status", "expiresAt"])
    .index("by_issuer_created", ["issuedBy", "createdAt"]),

  connections: defineTable({
    leftProfileId: v.id("profiles"),
    rightProfileId: v.id("profiles"),
    createdBy: v.id("profiles"),
    createdAt: v.number(),
  })
    .index("by_pair", ["leftProfileId", "rightProfileId"])
    .index("by_left", ["leftProfileId"])
    .index("by_right", ["rightProfileId"]),

  conversations: defineTable({
    kind: v.union(v.literal("direct"), v.literal("group")),
    // Optional for existing direct rows; group rows use the fields below.
    connectionId: v.optional(v.id("connections")),
    groupName: v.optional(v.string()),
    ownerProfileId: v.optional(v.id("profiles")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_connection", ["connectionId"])
    .index("by_owner_created", ["ownerProfileId", "createdAt"]),

  conversationMembers: defineTable({
    conversationId: v.id("conversations"),
    profileId: v.id("profiles"),
    role: v.optional(v.union(v.literal("owner"), v.literal("admin"), v.literal("member"))),
    joinedAt: v.number(),
  })
    .index("by_conversation_profile", ["conversationId", "profileId"])
    .index("by_profile", ["profileId"]),

  groupInvites: defineTable({
    conversationId: v.id("conversations"),
    invitedProfileId: v.id("profiles"),
    invitedBy: v.id("profiles"),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("declined"), v.literal("revoked")),
    createdAt: v.number(),
    respondedAt: v.optional(v.number()),
  })
    .index("by_invited_status", ["invitedProfileId", "status"])
    .index("by_conversation_invitee", ["conversationId", "invitedProfileId"])
    .index("by_inviter_created", ["invitedBy", "createdAt"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    senderProfileId: v.id("profiles"),
    body: v.string(),
    clientNonce: v.string(),
    createdAt: v.number(),
  })
    .index("by_conversation_time", ["conversationId", "createdAt"])
    .index("by_sender_nonce", ["senderProfileId", "clientNonce"])
    .index("by_sender_time", ["senderProfileId", "createdAt"]),

  blocks: defineTable({
    blockerProfileId: v.id("profiles"),
    blockedProfileId: v.id("profiles"),
    createdAt: v.number(),
  }).index("by_pair", ["blockerProfileId", "blockedProfileId"]),

  auditLogs: defineTable({
    actorProfileId: v.optional(v.id("profiles")),
    action: v.string(),
    targetId: v.string(),
    createdAt: v.number(),
  }).index("by_actor", ["actorProfileId"]),
});


