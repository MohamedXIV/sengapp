import { describe, expect, it } from "vitest";
import {
  DEFAULT_VISUAL_PREFERENCES,
  resolveVisualPreferences,
  visualPreferencesSchema,
} from "@/lib/themes/preferences";

describe("personal theme preferences contract", () => {
  it("resolves absent or partial settings into safe defaults without mutation", () => {
    expect(resolveVisualPreferences()).toEqual(DEFAULT_VISUAL_PREFERENCES);
    expect(resolveVisualPreferences(null)).toEqual(DEFAULT_VISUAL_PREFERENCES);
    expect(resolveVisualPreferences({ preset: "ocean", radius: "round" })).toEqual({
      ...DEFAULT_VISUAL_PREFERENCES,
      preset: "ocean",
      radius: "round",
    });
  });

  it("rejects unknown presets, unsupported fonts, arbitrary colors, and extra fields", () => {
    const valid = {
      preset: "forest", accent: "sage", font: "nunito",
      radius: "soft", density: "compact",
    };
    expect(visualPreferencesSchema.safeParse(valid).success).toBe(true);
    for (const invalid of [
      { ...valid, preset: "my-custom-css" },
      { ...valid, accent: "#ff0000" },
      { ...valid, font: "url(https://bad.example/x)" },
      { ...valid, density: "tiny" },
      { ...valid, customCss: "body { display:none }" },
    ]) {
      expect(visualPreferencesSchema.safeParse(invalid).success).toBe(false);
    }
  });
});
