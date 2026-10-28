import { describe, expect, it } from "vitest";
import {
  profileUpdateSchema,
  presencePreferencesSchema,
} from "../../src/lib/validations/profile";
import { detectTextDirection } from "../../src/lib/i18n/direction";

describe("Profile Validation & Bilingual RTL/LTR Direction", () => {
  it("detects Arabic script as RTL and English Latin script as LTR", () => {
    expect(detectTextDirection("مرحبا بكم في سنجاب")).toBe("rtl");
    expect(detectTextDirection("Welcome to Sengapp")).toBe("ltr");
  });

  it("validates independent presence toggles", () => {
    const parsed = presencePreferencesSchema.safeParse({
      onlineStatus: true,
      lastSeen: false,
      readReceipts: false,
      typingIndicators: true,
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects malformed handles", () => {
    const invalid = profileUpdateSchema.safeParse({
      displayName: "Salma",
      handle: "Invalid Handle!",
      avatarPresetKey: "acorn-scout",
      avatarAccentColor: "#b85d19",
      locale: "ar",
      textDirection: "auto",
      themePreference: "system",
      reducedMotion: false,
    });
    expect(invalid.success).toBe(false);
  });
});
