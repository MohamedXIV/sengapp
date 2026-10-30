import { describe, expect, it } from "vitest";
import { convexTest } from "convex-test";
import schema from "../../convex/schema";
import { api } from "../../convex/_generated/api";
import { handleStem, fallbackDisplayName } from "../../convex/lib/profileIdentity";

const modules = import.meta.glob("../../convex/**/*.{ts,js}");
const form = (handle: string, displayName = "Updated") => ({
  displayName, handle, bio: "", statusMessage: "", avatarPresetKey: "acorn-scout",
  avatarAccentColor: "#C68A45", locale: "en" as const, textDirection: "auto" as const,
  reducedMotion: false,
});

describe("verified account identity and one-time handles", () => {
  it("uses Clerk identity names and creates stable unique handles with light as default", async () => {
    const t = convexTest(schema, modules);
    const alice = t.withIdentity({subject:"subject-a", email:"alice@gmail.com", emailVerified:true, name:"Alice Jones"});
    const bob = t.withIdentity({subject:"subject-b", email:"alice@other.com", emailVerified:true, name:"Alice Jones"});
    const id = await alice.mutation(api.profiles.ensureMine, {});
    await bob.mutation(api.profiles.ensureMine, {});
    const first = await alice.query(api.profiles.getMine, {});
    const second = await bob.query(api.profiles.getMine, {});
    expect(first?.displayName).toBe("Alice Jones");
    expect(first?.displayNameSource).toBe("provider");
    expect(first?.themePreference).toBe("light");
    expect(first?.handle).toMatch(/^alice_jones_[a-f0-9]{10}$/);
    expect(first?.handle).not.toBe(second?.handle);
    expect(await alice.mutation(api.profiles.ensureMine, {locale:"ar"})).toBe(id);
    expect((await alice.query(api.profiles.getMine, {}))?.handle).toBe(first?.handle);
  });

  it("hydrates a fallback name from Clerk later and never overwrites a user edit", async () => {
    const t=convexTest(schema,modules);
    const alice=t.withIdentity({subject:"clerk-name",email:"sunny.flower@example.com",emailVerified:true});
    await alice.mutation(api.profiles.ensureMine, {});
    expect((await alice.query(api.profiles.getMine, {}))?.displayName).toBe("sunny flower");
    await alice.mutation(api.profiles.ensureMine, {displayNameHint:"Sunny Flower"});
    expect((await alice.query(api.profiles.getMine, {}))?.displayName).toBe("Sunny Flower");
    const handle=(await alice.query(api.profiles.getMine, {}))!.handle!;
    await alice.mutation(api.profiles.updateMine, form(handle,"My chosen name"));
    await alice.mutation(api.profiles.ensureMine, {displayNameHint:"Unwanted override"});
    expect((await alice.query(api.profiles.getMine, {}))?.displayName).toBe("My chosen name");
  });

  it("allows one successful handle rename but normal saves never consume it", async () => {
    const t=convexTest(schema,modules);
    const alice=t.withIdentity({subject:"rename-user",email:"one@example.com",emailVerified:true});
    await alice.mutation(api.profiles.ensureMine, {});
    const original=(await alice.query(api.profiles.getMine, {}))!.handle!;
    await alice.mutation(api.profiles.updateMine, form(original,"Still me"));
    expect((await alice.query(api.profiles.getMine, {}))?.handleChangedAt).toBeUndefined();
    await alice.mutation(api.profiles.updateMine, form("my_one_change"));
    expect((await alice.query(api.profiles.getMine, {}))?.handleChangedAt).toEqual(expect.any(Number));
    await alice.mutation(api.profiles.updateMine, form("my_one_change","New name allowed"));
    await expect(alice.mutation(api.profiles.updateMine, form("not_allowed"))).rejects.toThrow("HANDLE_CHANGE_USED");
    expect((await alice.query(api.profiles.getMine, {}))?.handle).toBe("my_one_change");
  });

  it("rejects taking existing handles without consuming the change", async () => {
    const t=convexTest(schema,modules);
    const alice=t.withIdentity({subject:"a-taken",email:"a@example.com",emailVerified:true});
    const bob=t.withIdentity({subject:"b-taken",email:"b@example.com",emailVerified:true});
    await alice.mutation(api.profiles.ensureMine, {});
    await bob.mutation(api.profiles.ensureMine, {});
    const taken=(await bob.query(api.profiles.getMine, {}))!.handle!;
    await expect(alice.mutation(api.profiles.updateMine, form(taken))).rejects.toThrow("HANDLE_TAKEN");
    expect((await alice.query(api.profiles.getMine, {}))?.handleChangedAt).toBeUndefined();
    expect(handleStem("أحمد")).toBe("friend");
    expect(fallbackDisplayName("first.last@example.com")).toBe("first last");
  });
});
