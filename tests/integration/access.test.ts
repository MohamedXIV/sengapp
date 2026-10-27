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

describe("Convex invite-only membership boundary", () => {
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
      subject: "outsider", email: "outsider@example.com", email_verified: true, name: "Outsider",
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
      subject: "unverified-claimant", email: "operator@example.com", email_verified: false,
    });
    await expect(claimant.mutation(api.profiles.bootstrapOperator, {})).rejects.toThrow();
    const operator = t.withIdentity({
      subject: "verified-operator", email: "operator@example.com", email_verified: true, name: "Owner",
    });
    const first = await operator.mutation(api.profiles.bootstrapOperator, {});
    const second = await operator.mutation(api.profiles.bootstrapOperator, {});
    expect(first).toBe(second);
    expect((await operator.query(api.profiles.getMine, {}))?.role).toBe("operator");
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

  it("consumes an invite only once, with membership created atomically", async () => {
    vi.stubEnv("SENGAPP_OPERATOR_EMAILS", "operator@example.com");
    const t = convexTest(schema, modules);
    const operator = t.withIdentity({
      subject: "verified-operator", email: "operator@example.com", email_verified: true,
    });
    await operator.mutation(api.profiles.bootstrapOperator, {});
    const { code } = await operator.action(api.invites.issue, { ttlHours: 24 });
    expect(code).toMatch(/^[A-Za-z0-9_-]{43}$/);
    const firstUser = t.withIdentity({ subject: "person-a", email: "a@example.com", email_verified: true });
    const secondUser = t.withIdentity({ subject: "person-b", email: "b@example.com", email_verified: true });
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
      subject: "verified-operator", email: "operator@example.com", email_verified: true,
    });
    await operator.mutation(api.profiles.bootstrapOperator, {});
    const outsider = t.withIdentity({ subject: "person-c", email: "c@example.com", email_verified: true });
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
