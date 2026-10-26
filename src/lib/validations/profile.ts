import { z } from "zod";

export const SQUIRREL_AVATAR_PRESETS = [
  "acorn-scout",
  "redwood-dreamer",
  "hazelnut-scribe",
  "lantern-keeper",
] as const;

export const profileUpdateSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "Display name is required.")
    .max(50, "Display name cannot exceed 50 characters."),
  handle: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      /^[a-z0-9_]{3,24}$/,
      "Handle must be 3–24 characters (lowercase letters, numbers, underscores)."
    ),
  bio: z
    .string()
    .trim()
    .max(240, "Bio cannot exceed 240 characters.")
    .optional()
    .or(z.literal("")),
  statusMessage: z
    .string()
    .trim()
    .max(80, "Status message cannot exceed 80 characters.")
    .optional()
    .or(z.literal("")),
  avatarPresetKey: z.enum(SQUIRREL_AVATAR_PRESETS),
  avatarAccentColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Accent color must be a valid hex color."),
  locale: z.enum(["en", "ar"]),
  textDirection: z.enum(["ltr", "rtl", "auto"]),
  themePreference: z.enum(["light", "dark", "system"]),
  reducedMotion: z.boolean(),
});

export const presencePreferencesSchema = z.object({
  onlineStatus: z.boolean(),
  lastSeen: z.boolean(),
  readReceipts: z.boolean(),
  typingIndicators: z.boolean(),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type PresencePreferencesInput = z.infer<typeof presencePreferencesSchema>;
