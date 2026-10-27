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

  it("denies a signed-in outsider access to profiles and editing profiles", async () => {
    const t = convexTest(schema, modules);
    const outsider = t.withIdentity({
      subject: "outsider", email: "outsider@example.com", emailVerified: true, name: "Outsider",
    });
    expect(await outsider.query(api.profiles.getMine, {})).toBeNull();
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

});
