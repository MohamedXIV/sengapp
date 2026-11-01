import { describe, expect, it } from "vitest";
import { convexTest } from "convex-test";
import schema from "../../convex/schema";
import { api } from "../../convex/_generated/api";

const modules = import.meta.glob("../../convex/**/*.{ts,js}");
const style = { material: "glass" as const, opacity: 82, blur: 16, atmosphere: "mist" as const };

describe("account-owned window materials", () => {
  it("requires a verified signed-in profile, not a client supplied profile id", async () => {
    const t = convexTest(schema, modules);
    const guest = t.withIdentity({ subject: "guest", email: "guest@example.com", emailVerified: false });
    await expect(guest.mutation(api.profiles.updateWindowStyle, style)).rejects.toThrow();
    const alice = t.withIdentity({ subject: "style-alice", email: "style-alice@example.com", emailVerified: true });
    await alice.mutation(api.profiles.ensureMine, {});
    await expect(alice.mutation(api.profiles.updateWindowStyle, { ...style, opacity: 25 })).rejects.toThrow();
    await expect(alice.mutation(api.profiles.updateWindowStyle, { ...style, blur: 29 })).rejects.toThrow();
    await expect(alice.mutation(api.profiles.updateWindowStyle, { ...style, blur: 0.5 })).rejects.toThrow();
    await expect(alice.mutation(api.profiles.updateWindowStyle, {
      ...style, material: "<img>" as typeof style.material,
    })).rejects.toThrow();
  });

  it("synchronizes the owner's selection without modifying another member or their classic theme", async () => {
    const t = convexTest(schema, modules);
    const alice = t.withIdentity({ subject: "style-owner", email: "owner@example.com", emailVerified: true });
    const bob = t.withIdentity({ subject: "style-peer", email: "peer@example.com", emailVerified: true });
    await alice.mutation(api.profiles.ensureMine, {});
    await bob.mutation(api.profiles.ensureMine, {});
    const result = await alice.mutation(api.profiles.updateWindowStyle, style);
    expect(result.updatedAt).toEqual(expect.any(Number));
    expect((await alice.query(api.profiles.getMine, {}))?.windowStyle).toEqual(style);
    expect((await bob.query(api.profiles.getMine, {}))?.windowStyle).toBeUndefined();

    await alice.mutation(api.profiles.updateUiShortcuts, { locale: "ar" });
    expect(await alice.query(api.profiles.getMine, {})).toMatchObject({
      locale: "ar", themePreference: "light", windowStyle: style,
    });
    await alice.mutation(api.profiles.updateWindowStyle, {
      material: "paper", opacity: 100, blur: 0, atmosphere: "none",
    });
    expect((await alice.query(api.profiles.getMine, {}))?.windowStyle).toEqual({
      material: "paper", opacity: 100, blur: 0, atmosphere: "none",
    });
  });
});
