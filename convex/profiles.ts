import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  getVerifiedAuthUser, isAllowedVerifiedOperator, readVerifiedIdentity, requireAuthorizedProfile,
} from "./lib/permissions";

export const getMine = query({
  args: {},
  handler: async (ctx) => {
    const user = await readVerifiedIdentity(ctx);
    if (!user) return null;
    const profile = await ctx.db.query("profiles")
      .withIndex("by_auth_user_id", (q) => q.eq("authUserId", user.userId)).unique();
    return profile?.status === "active" ? profile : null;
  },
});

function initialProfileFields(
  user: Awaited<ReturnType<typeof getVerifiedAuthUser>>,
  role: "member" | "operator",
  locale: "en" | "ar" = "en",
) {
  const now = Date.now();
  return {
    authUserId: user.userId, email: user.email,
    displayName: user.name?.trim().slice(0, 50) || "New member",
    role, status: "active" as const, joinedAt: now, updatedAt: now,
    avatarPresetKey: "acorn-scout", avatarAccentColor: "#C68A45",
    locale, textDirection: "auto" as const,
    themePreference: "system" as const, reducedMotion: false,
    presencePreferences: {
      onlineStatus: true, lastSeen: true, readReceipts: true, typingIndicators: true,
    },
  };
}

// Convex mutations are serializable: concurrent calls for one Clerk subject
// observe the same indexed row and never create duplicate memberships.
export const ensureMine = mutation({
  args: { locale: v.optional(v.union(v.literal("en"), v.literal("ar"))) },
  handler: async (ctx, { locale }) => {
    const user = await getVerifiedAuthUser(ctx);
    const existing = await ctx.db.query("profiles")
      .withIndex("by_auth_user_id", (q) => q.eq("authUserId", user.userId)).unique();
    if (existing) {
      if (existing.status !== "active") throw new ConvexError({ code: "SUSPENDED" });
      return existing._id;
    }
    return ctx.db.insert("profiles", initialProfileFields(user, "member", locale));
  },
});

// Operator activation is a separate explicit server-authorized operation,
// never a side effect of ordinary verified signup.
export const bootstrapOperator = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getVerifiedAuthUser(ctx);
    if (!isAllowedVerifiedOperator(user.email, true, process.env.SENGAPP_OPERATOR_EMAILS)) {
      throw new ConvexError({ code: "FORBIDDEN" });
    }
    const existing = await ctx.db.query("profiles")
      .withIndex("by_auth_user_id", (q) => q.eq("authUserId", user.userId)).unique();
    if (existing?.status === "suspended") throw new ConvexError({ code: "SUSPENDED" });
    const now = Date.now();
    if (existing) {
      if (existing.role === "operator") return existing._id;
      await ctx.db.patch(existing._id, { role: "operator", updatedAt: now });
      await ctx.db.insert("auditLogs", {
        actorProfileId: existing._id, action: "operator.promoted",
        targetId: String(existing._id), createdAt: now,
      });
      return existing._id;
    }
    const id = await ctx.db.insert("profiles", initialProfileFields(user, "operator"));
    await ctx.db.insert("auditLogs", {
      actorProfileId: id, action: "operator.bootstrapped",
      targetId: String(id), createdAt: now,
    });
    return id;
  },
});

export const updateMine = mutation({
  args: {
    displayName: v.string(),
    handle: v.string(),
    bio: v.optional(v.string()),
    statusMessage: v.optional(v.string()),
    avatarPresetKey: v.string(),
    avatarAccentColor: v.string(),
    locale: v.union(v.literal("en"), v.literal("ar")),
    textDirection: v.union(v.literal("ltr"), v.literal("rtl"), v.literal("auto")),
    reducedMotion: v.boolean(),
  },
  handler: async (ctx, args) => {
    const profile = await requireAuthorizedProfile(ctx);
    const displayName = args.displayName.trim();
    const handle = args.handle.trim().toLowerCase();
    if (displayName.length < 1 || displayName.length > 50
      || !/^[a-z0-9_]{3,24}$/.test(handle)
      || (args.bio?.length ?? 0) > 240
      || (args.statusMessage?.length ?? 0) > 80
      || !/^#[A-Fa-f0-9]{6}$/.test(args.avatarAccentColor)
      || !["acorn-scout", "redwood-dreamer", "hazelnut-scribe", "lantern-keeper"].includes(args.avatarPresetKey)) {
      throw new ConvexError({ code: "INVALID_PROFILE" });
    }
    const duplicate = await ctx.db.query("profiles")
      .withIndex("by_handle", (q) => q.eq("handle", handle)).unique();
    if (duplicate && duplicate._id !== profile._id) throw new ConvexError({ code: "HANDLE_TAKEN" });
    const updatedAt = Date.now();
    await ctx.db.patch(profile._id, {
      displayName, handle, bio: args.bio?.trim(),
      statusMessage: args.statusMessage?.trim(),
      avatarPresetKey: args.avatarPresetKey, avatarAccentColor: args.avatarAccentColor,
      locale: args.locale, textDirection: args.textDirection,
      reducedMotion: args.reducedMotion,
      updatedAt,
    });
    return { updatedAt };
  },
});

export const updatePresencePreferences = mutation({
  args: {
    onlineStatus: v.boolean(), lastSeen: v.boolean(),
    readReceipts: v.boolean(), typingIndicators: v.boolean(),
  },
  handler: async (ctx, args) => {
    const profile = await requireAuthorizedProfile(ctx);
    await ctx.db.patch(profile._id, { presencePreferences: args, updatedAt: Date.now() });
  },
});

// Each parameter is a closed Convex enum. Extra fields and user-authored CSS
// cannot cross this mutation's boundary. Only the authenticated caller is updated.
export const updateVisualPreferences = mutation({
  args: {
    preset: v.union(v.literal("acorn"), v.literal("forest"), v.literal("dusk"), v.literal("ocean")),
    accent: v.union(v.literal("amber"), v.literal("coral"), v.literal("sage"), v.literal("teal"), v.literal("blue"), v.literal("violet")),
    font: v.union(v.literal("system"), v.literal("inter"), v.literal("nunito")),
    radius: v.union(v.literal("subtle"), v.literal("soft"), v.literal("round")),
    density: v.union(v.literal("comfortable"), v.literal("compact")),
    themePreference: v.optional(v.union(v.literal("light"), v.literal("dark"), v.literal("system"))),
  },
  handler: async (ctx, { themePreference, ...preferences }) => {
    const profile = await requireAuthorizedProfile(ctx);
    const updatedAt = Date.now();
    await ctx.db.patch(profile._id, {
      visualPreferences: preferences,
      ...(themePreference ? { themePreference } : {}),
      updatedAt,
    });
    return { updatedAt };
  },
});

// Atomic account-scoped shortcuts for the persistent sidebar controls.
// They must not save a stale copy of the full profile or visual preset.
export const updateUiShortcuts = mutation({
  args: {
    locale: v.optional(v.union(v.literal("en"), v.literal("ar"))),
    themePreference: v.optional(v.union(v.literal("light"), v.literal("dark"), v.literal("system"))),
  },
  handler: async (ctx, { locale, themePreference }) => {
    const profile = await requireAuthorizedProfile(ctx);
    if (locale === undefined && themePreference === undefined) {
      throw new ConvexError({ code: "EMPTY_PREFERENCES" });
    }
    const updatedAt = Date.now();
    await ctx.db.patch(profile._id, {
      ...(locale !== undefined ? { locale } : {}),
      ...(themePreference !== undefined ? { themePreference } : {}),
      updatedAt,
    });
    return { updatedAt };
  },
});

