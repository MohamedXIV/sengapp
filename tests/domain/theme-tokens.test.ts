import { describe, expect, it } from "vitest";
import { getThemeTokens } from "@/lib/themes/presets";
import { DEFAULT_VISUAL_PREFERENCES, THEME_PRESETS } from "@/lib/themes/preferences";

describe("semantic personal-theme tokens", () => {
  it("provides independently distinct light and dark palettes for every preset", () => {
    const lightBackgrounds = new Set<string>();
    for (const preset of THEME_PRESETS) {
      const prefs = { ...DEFAULT_VISUAL_PREFERENCES, preset };
      const light = getThemeTokens(prefs, "light");
      const dark = getThemeTokens(prefs, "dark");
      expect(light["--background"]).not.toBe(dark["--background"]);
      expect(light["--foreground"]).not.toBe(dark["--foreground"]);
      expect(light["--primary-foreground"]).toBeTruthy();
      expect(dark["--primary-foreground"]).toBeTruthy();
      lightBackgrounds.add(light["--background"] ?? "");
    }
    expect(lightBackgrounds.size).toBe(THEME_PRESETS.length);
  });

  it("changes independent accents, typography, radius, and density without arbitrary CSS", () => {
    const base = getThemeTokens(DEFAULT_VISUAL_PREFERENCES, "light");
    const changed = getThemeTokens({
      preset: "ocean", accent: "violet", font: "nunito", radius: "round", density: "compact",
    }, "light");
    expect(changed["--primary"]).not.toBe(base["--primary"]);
    expect(changed["--font-sans-app"]).toContain("Nunito");
    expect(changed["--radius"]).not.toBe(base["--radius"]);
    expect(changed["--sengapp-space"]).not.toBe(base["--sengapp-space"]);
    expect(Object.keys(changed).every((key) => key.startsWith("--"))).toBe(true);
  });
});
