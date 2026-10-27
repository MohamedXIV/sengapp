import { afterEach, describe, expect, it, vi } from "vitest";
import { convexTest } from "convex-test";
import schema from "../../convex/schema";
import { api } from "../../convex/_generated/api";

// The real Convex functions consume identity claims via ctx.auth. These tests
// exercise that membership boundary without mocking the identity adapter.

const modules = import.meta.glob("../../convex/**/*.{ts,js}");

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe("Convex verified signup and membership boundary", () => {
  it("accepts the Convex-normalized emailVerified claim from a verified Clerk JWT", async () => {
    vi.stubEnv("SENGAPP_OPERATOR_EMAILS", "verified@example.com");
    const t = convexTest(schema, modules);
    const verified = t.withIdentity({
      subject: "oidc-clerk-verified", email: "verified@example.com", emailVerified: true,
    });
    const profileId = await verified.mutation(api.profiles.bootstrapOperator, {});
    expect(profileId).toBeTruthy();
    expect((await verified.query(api.profiles.getMine, {}))?.role).toBe("operator");
  });

  it("denies a signed-in outsider access to profiles and issuing invites", async () => {
    const t = convexTest(schema, modules);
    const outsider = t.withIdentity({
      subject: "outsider", email: "outsider@example.com", emailVerified: true, name: "Outsider",
    });
    expect(await outsider.query(api.profiles.getMine, {})).toBeNull();
    await expect(outsider.action(api.invites.issue, { ttlHours: 24 })).rejects.toThrow();
    await expect(outsider.mutation(api.profiles.updatePresencePreferences, {
      onlineStatus: false, lastSeen: false, readReceipts: false, typingIndicators: false,
    })).rejects.toThrow();
  });

  it("only bootstraps a verified allowlisted operator, idempotently", async () => {
    vi.stubEnv("SENGAPP_OPERATOR_EMAILS", "operator@example.com");
    const t = convexTest(schema, modules);
    const claimant = t.withIdentity({
      subject: "unverified-claimant", email: "operator@example.com", emailVerified: false,
    });
    await expect(claimant.mutation(api.profiles.bootstrapOperator, {})).rejects.toThrow();
    const operator = t.withIdentity({
      subject: "verified-operator", email: "operator@example.com", emailVerified: true, name: "Owner",
    });
    const first = await operator.mutation(api.profiles.bootstrapOperator, {});
    const second = await operator.mutation(api.profiles.bootstrapOperator, {});
    expect(first).toBe(second);
    expect((await operator.query(api.profiles.getMine, {}))?.role).toBe("operator");
  });

  it("rejects unnormalized email_verified-only identities instead of trusting the raw key", async () => {
    vi.stubEnv("SENGAPP_OPERATOR_EMAILS", "operator@example.com");
    const t = convexTest(schema, modules);
    const rawOnly = t.withIdentity({
      subject: "raw-claim", email: "operator@example.com", email_verified: true,
    });
    await expect(rawOnly.mutation(api.profiles.bootstrapOperator, {})).rejects.toThrow();
  });

  it("fails closed if a signed JWT lacks an explicit verified-email claim", async () => {
    vi.stubEnv("SENGAPP_OPERATOR_EMAILS", "operator@example.com");
    const t = convexTest(schema, modules);
    const claimMissing = t.withIdentity({
      subject: "operator-without-verification-claim", email: "operator@example.com",
    });
    await expect(claimMissing.mutation(api.profiles.bootstrapOperator, {})).rejects.toThrow();
    expect(await claimMissing.query(api.profiles.getMine, {})).toBeNull();
  });

  it("creates active member profiles for unrelated verified signups without invitations", async () => {
    const t = convexTest(schema, modules);
    const alice = t.withIdentity({ subject: "alice-auth", email: "alice@example.com", emailVerified: true, name: "Alice" });
    const bob = t.withIdentity({ subject: "bob-auth", email: "bob@example.com", emailVerified: true, name: "Bob" });
    const aliceId = await alice.mutation(api.profiles.ensureMine, {});
    const bobId = await bob.mutation(api.profiles.ensureMine, {});
    expect(aliceId).not.toBe(bobId);
    expect(await alice.query(api.profiles.getMine, {})).toMatchObject({ role: "member", status: "active", displayName: "Alice" });
    expect(await bob.query(api.profiles.getMine, {})).toMatchObject({ role: "member", status: "active", displayName: "Bob" });
    expect((await t.run((ctx) => ctx.db.query("profiles").collect()))).toHaveLength(2);
    await expect(alice.mutation(api.profiles.updatePresencePreferences, {
      onlineStatus: false, lastSeen: false, readReceipts: false, typingIndicators: false,
    })).resolves.toBeNull();
    await expect(alice.query(api.invites.list, {})).rejects.toThrow();
  });

  it("handles concurrent onboarding calls idempotently, including repeated sign-ins", async () => {
    const t = convexTest(schema, modules);
    const alice = t.withIdentity({ subject: "same-auth", email: "one@example.com", emailVerified: true });
    const [a, b, c] = await Promise.all([
      alice.mutation(api.profiles.ensureMine, {}),
      alice.mutation(api.profiles.ensureMine, {}),
      alice.mutation(api.profiles.ensureMine, {}),
    ]);
    expect(a).toBe(b);
    expect(a).toBe(c);
    expect(await alice.mutation(api.profiles.ensureMine, {})).toBe(a);
    expect((await t.run((ctx) => ctx.db.query("profiles").collect()))).toHaveLength(1);
  });

  it("refuses unverified onboarding and cannot reactivate a suspended member", async () => {
    const t = convexTest(schema, modules);
    await expect(t.mutation(api.profiles.ensureMine, {})).rejects.toThrow();
    const unverified = t.withIdentity({ subject: "claimed", email: "claimed@example.com", emailVerified: false });
    await expect(unverified.mutation(api.profiles.ensureMine, {})).rejects.toThrow();
    const verified = t.withIdentity({ subject: "member", email: "member@example.com", emailVerified: true });
    const id = await verified.mutation(api.profiles.ensureMine, {});
    await t.run((ctx) => ctx.db.patch(id, { status: "suspended" }));
    await expect(verified.mutation(api.profiles.ensureMine, {})).rejects.toThrow();
    expect(await verified.query(api.profiles.getMine, {})).toBeNull();
  });

  it("requires explicit elevation of an existing allowlisted member and refuses other accounts", async () => {
    vi.stubEnv("SENGAPP_OPERATOR_EMAILS", "owner@example.com");
    const t = convexTest(schema, modules);
    const owner = t.withIdentity({ subject: "owner", email: "owner@example.com", emailVerified: true });
    const memberId = await owner.mutation(api.profiles.ensureMine, {});
    expect((await owner.query(api.profiles.getMine, {}))?.role).toBe("member");
    expect(await owner.mutation(api.profiles.bootstrapOperator, {})).toBe(memberId);
    expect(await owner.mutation(api.profiles.bootstrapOperator, {})).toBe(memberId);
    expect((await owner.query(api.profiles.getMine, {}))?.role).toBe("operator");
    const ordinary = t.withIdentity({ subject: "ordinary", email: "ordinary@example.com", emailVerified: true });
    await ordinary.mutation(api.profiles.ensureMine, {});
    await expect(ordinary.mutation(api.profiles.bootstrapOperator, {})).rejects.toThrow();
    const suspended = t.withIdentity({ subject: "suspended", email: "owner@example.com", emailVerified: true });
    const suspendedId = await suspended.mutation(api.profiles.ensureMine, {});
    await t.run((ctx) => ctx.db.patch(suspendedId, { status: "suspended" }));
    await expect(suspended.mutation(api.profiles.bootstrapOperator, {})).rejects.toThrow();
  });

  it("consumes an invite only once, with membership created atomically", async () => {
    vi.stubEnv("SENGAPP_OPERATOR_EMAILS", "operator@example.com");
    const t = convexTest(schema, modules);
    const operator = t.withIdentity({
      subject: "verified-operator", email: "operator@example.com", emailVerified: true,
    });
    await operator.mutation(api.profiles.bootstrapOperator, {});
    const { code } = await operator.action(api.invites.issue, { ttlHours: 24 });
    expect(code).toMatch(/^[A-Za-z0-9_-]{43}$/);
    const firstUser = t.withIdentity({ subject: "person-a", email: "a@example.com", emailVerified: true });
    const secondUser = t.withIdentity({ subject: "person-b", email: "b@example.com", emailVerified: true });
    const payload = { code, displayName: "Alice", handle: "alice", locale: "en" as const };
    const results = await Promise.allSettled([
      firstUser.mutation(api.invites.redeem, payload),
      secondUser.mutation(api.invites.redeem, { ...payload, handle: "bob" }),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((r) => r.status === "rejected")).toHaveLength(1);
    const state = await t.run(async (ctx) => ({
      invitations: await ctx.db.query("invitations").collect(),
      profiles: await ctx.db.query("profiles").collect(),
    }));
    expect(state.profiles).toHaveLength(2); // operator and one new member
    expect(state.invitations[0]).toMatchObject({ status: "redeemed" });
    expect(JSON.stringify(state.invitations)).not.toContain(code);
    const member = results[0]?.status === "fulfilled" ? firstUser : secondUser;
    await expect(member.action(api.invites.issue, { ttlHours: 24 })).rejects.toThrow();
  });

  it("rejects revoked, expired and email-bound codes", async () => {
    vi.stubEnv("SENGAPP_OPERATOR_EMAILS", "operator@example.com");
    const t = convexTest(schema, modules);
    const operator = t.withIdentity({
      subject: "verified-operator", email: "operator@example.com", emailVerified: true,
    });
    await operator.mutation(api.profiles.bootstrapOperator, {});
    const outsider = t.withIdentity({ subject: "person-c", email: "c@example.com", emailVerified: true });
    await expect(operator.action(api.invites.issue, { ttlHours: 0 })).rejects.toThrow();

    const reserved = await operator.action(api.invites.issue, {
      ttlHours: 24, recipientEmail: "other@example.com",
    });
    await expect(outsider.mutation(api.invites.redeem, {
      code: reserved.code, displayName: "Carla", handle: "carla", locale: "en",
    })).rejects.toThrow();

    const toRevoke = await operator.action(api.invites.issue, { ttlHours: 24 });
    const ledger = await operator.query(api.invites.list, {});
    const pending = ledger.find((inv) => inv.codeHint === `${toRevoke.code.slice(0, 4)}…${toRevoke.code.slice(-4)}`);
    expect(pending).toBeTruthy();
    await operator.mutation(api.invites.revoke, { invitationId: pending!._id });
    await expect(outsider.mutation(api.invites.redeem, {
      code: toRevoke.code, displayName: "Carla", handle: "carla", locale: "en",
    })).rejects.toThrow();

    const soonExpired = await operator.action(api.invites.issue, { ttlHours: 1 });
    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + 3_600_001);
    await expect(outsider.mutation(api.invites.redeem, {
      code: soonExpired.code, displayName: "Carla", handle: "carla", locale: "en",
    })).rejects.toThrow();
    expect(await outsider.query(api.profiles.getMine, {})).toBeNull();
  });
});
