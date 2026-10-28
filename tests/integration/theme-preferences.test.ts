import { describe, expect, it } from "vitest";
import { convexTest } from "convex-test";
import schema from "../../convex/schema";
import { api } from "../../convex/_generated/api";

const modules = import.meta.glob("../../convex/**/*.{ts,js}");
const preferred = {
  preset: "ocean" as const,
  accent: "teal" as const,
  font: "inter" as const,
  radius: "round" as const,
  density: "compact" as const,
};

describe("private Convex theme persistence", () => {
  it("requires a verified member and rejects forged values", async () => {
    const t = convexTest(schema, modules);
    const anonymous = t.withIdentity({ subject: "anonymous-unverified", email: "a@example.com", emailVerified: false });
    await expect(anonymous.mutation(api.profiles.updateVisualPreferences, preferred)).rejects.toThrow();
    const alice = t.withIdentity({ subject: "alice", email: "a@example.com", emailVerified: true });
    await alice.mutation(api.profiles.ensureMine, {});
    await expect(alice.mutation(api.profiles.updateVisualPreferences, {
      ...preferred, accent: "#f00" as typeof preferred.accent,
    })).rejects.toThrow();
  });

  it("persists only on the caller's profile and keeps another account at defaults", async () => {
    const t = convexTest(schema, modules);
    const alice = t.withIdentity({ subject: "theme-alice", email: "alice@example.com", emailVerified: true });
    const bob = t.withIdentity({ subject: "theme-bob", email: "bob@example.com", emailVerified: true });
    await alice.mutation(api.profiles.ensureMine, {});
    await bob.mutation(api.profiles.ensureMine, {});
    const result = await alice.mutation(api.profiles.updateVisualPreferences, preferred);
    expect(result.updatedAt).toEqual(expect.any(Number));
    expect((await alice.query(api.profiles.getMine, {}))?.visualPreferences).toEqual(preferred);
    expect((await bob.query(api.profiles.getMine, {}))?.visualPreferences).toBeUndefined();
  });

  it("saving identity fields does not overwrite an appearance choice", async () => {
    const t = convexTest(schema, modules);
    const alice = t.withIdentity({ subject: "theme-profile", email: "profile@example.com", emailVerified: true });
    await alice.mutation(api.profiles.ensureMine, {});
    await alice.mutation(api.profiles.updateVisualPreferences, { ...preferred, themePreference: "dark" });
    await alice.mutation(api.profiles.updateMine, {
      displayName: "Alice", handle: "alice_theme", bio: "Hello", statusMessage: "A little note",
      avatarPresetKey: "acorn-scout", avatarAccentColor: "#C68A45", locale: "en",
      textDirection: "auto", reducedMotion: false,
    });
    const profile = await alice.query(api.profiles.getMine, {});
    expect(profile?.themePreference).toBe("dark");
    expect(profile?.visualPreferences).toEqual(preferred);
  });

  it("changes account language and mode independently without resetting the visual theme", async () => {
    const t = convexTest(schema, modules);
    const alice = t.withIdentity({ subject: "shortcuts-alice", email: "shortcuts-a@example.com", emailVerified: true });
    const bob = t.withIdentity({ subject: "shortcuts-bob", email: "shortcuts-b@example.com", emailVerified: true });
    await alice.mutation(api.profiles.ensureMine, {});
    await bob.mutation(api.profiles.ensureMine, {});
    await alice.mutation(api.profiles.updateVisualPreferences, preferred);

    await alice.mutation(api.profiles.updateUiShortcuts, { locale: "ar" });
    expect(await alice.query(api.profiles.getMine, {})).toMatchObject({
      locale: "ar", themePreference: "system", visualPreferences: preferred,
    });
    await alice.mutation(api.profiles.updateUiShortcuts, { themePreference: "dark" });
    expect(await alice.query(api.profiles.getMine, {})).toMatchObject({
      locale: "ar", themePreference: "dark", visualPreferences: preferred,
    });
    expect(await bob.query(api.profiles.getMine, {})).toMatchObject({
      locale: "en", themePreference: "system",
    });
  });

  it("rejects unauthorized or empty quick settings patches", async () => {
    const t = convexTest(schema, modules);
    const anonymous = t.withIdentity({ subject: "no-access", email: "no@example.com", emailVerified: false });
    await expect(anonymous.mutation(api.profiles.updateUiShortcuts, { locale: "ar" })).rejects.toThrow();
    const alice = t.withIdentity({ subject: "shortcut-errors", email: "errors@example.com", emailVerified: true });
    await alice.mutation(api.profiles.ensureMine, {});
    await expect(alice.mutation(api.profiles.updateUiShortcuts, {})).rejects.toThrow();
    await expect(alice.mutation(api.profiles.updateUiShortcuts, {
      locale: "fr" as "ar",
    })).rejects.toThrow();
  });
});
