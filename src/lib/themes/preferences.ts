import { z } from "zod";

export const THEME_PRESETS = ["acorn", "forest", "dusk", "ocean"] as const;
export const THEME_ACCENTS = ["amber", "coral", "sage", "teal", "blue", "violet"] as const;
export const THEME_FONTS = ["system", "inter", "nunito"] as const;
export const THEME_RADII = ["subtle", "soft", "round"] as const;
export const THEME_DENSITIES = ["comfortable", "compact"] as const;

export const visualPreferencesSchema = z.strictObject({
  preset: z.enum(THEME_PRESETS),
  accent: z.enum(THEME_ACCENTS),
  font: z.enum(THEME_FONTS),
  radius: z.enum(THEME_RADII),
  density: z.enum(THEME_DENSITIES),
});

export type VisualPreferences = z.infer<typeof visualPreferencesSchema>;

export const DEFAULT_VISUAL_PREFERENCES: VisualPreferences = Object.freeze({
  preset: "acorn", accent: "amber", font: "system", radius: "soft", density: "comfortable",
});

export function resolveVisualPreferences(input?: Partial<VisualPreferences> | null): VisualPreferences {
  return { ...DEFAULT_VISUAL_PREFERENCES, ...(input ?? {}) };
}
