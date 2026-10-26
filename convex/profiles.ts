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

export const bootstrapOperator = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getVerifiedAuthUser(ctx);
    if (!isAllowedVerifiedOperator(
      user.email, true, process.env.SENGAPP_OPERATOR_EMAILS,
    )) {
      throw new ConvexError({ code: "FORBIDDEN" });
    }
    const authUserId = user.userId;
    const existing = await ctx.db.query("profiles")
      .withIndex("by_auth_user_id", (q) => q.eq("authUserId", authUserId)).unique();
    if (existing) {
      if (existing.role !== "operator" || existing.status !== "active") {
        throw new ConvexError({ code: "FORBIDDEN" });
      }
      return existing._id;
    }

    const now = Date.now();
    const id = await ctx.db.insert("profiles", {
      authUserId,
      email: user.email.trim().toLowerCase(),
      displayName: user.name?.trim().slice(0, 50) || "Sengapp Operator",
      role: "operator", status: "active",
      joinedAt: now, updatedAt: now, avatarPresetKey: "acorn-scout",
      avatarAccentColor: "#C68A45",
      locale: "en", textDirection: "auto", themePreference: "system",
      reducedMotion: false,
      presencePreferences: {
        onlineStatus: true, lastSeen: true, readReceipts: true, typingIndicators: true,
      },
    });
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
    themePreference: v.union(v.literal("light"), v.literal("dark"), v.literal("system")),
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
      themePreference: args.themePreference, reducedMotion: args.reducedMotion,
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
