import { describe, expect, it } from "vitest";
import {
  evaluateInvitationRedemption,
  createDefaultPresencePreferences,
} from "../../convex/lib/invitationDomain";
import {
  createTokenHint,
  generateSecureInvitationToken,
  hashInvitationToken,
} from "../../convex/lib/crypto";

describe("Invitation Cryptographic Token Handling", () => {
  it("generates high-entropy prefixed tokens and deterministic SHA-256 hashes", async () => {
    const tokenA = generateSecureInvitationToken();
    const tokenB = generateSecureInvitationToken();

    expect(tokenA).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(tokenA).not.toEqual(tokenB);

    const hashA1 = await hashInvitationToken(tokenA);
    const hashA2 = await hashInvitationToken(`  ${tokenA}  `);
    expect(hashA1).toHaveLength(64);
    expect(hashA1).toEqual(hashA2);

    const hint = createTokenHint(tokenA);
    expect(hint).not.toContain(tokenA.slice(10, 20));
  });
});

describe("Invitation Redemption Lifecycle Rules", () => {
  const now = 1_760_000_000_000;

  it("rejects missing invitations", () => {
    const res = evaluateInvitationRedemption(null, "user@example.com", now);
    expect(res).toEqual({
      valid: false,
      reason: "NOT_FOUND",
      message: "This invitation token does not exist.",
    });
  });

  it("rejects already redeemed invitations (one-time redemption rule)", () => {
    const res = evaluateInvitationRedemption(
      {
        status: "redeemed",
        expiresAt: now + 3600_000,
        redeemedByUserId: "user_123",
      },
      "user@example.com",
      now
    );
    expect(res.valid).toBe(false);
    if (!res.valid) {
      expect(res.reason).toBe("ALREADY_REDEEMED");
    }
  });

  it("rejects expired invitations at or past the expiration timestamp", () => {
    const res = evaluateInvitationRedemption(
      {
        status: "pending",
        expiresAt: now,
      },
      "user@example.com",
      now
    );
    expect(res.valid).toBe(false);
    if (!res.valid) {
      expect(res.reason).toBe("EXPIRED");
    }
  });

  it("rejects revoked invitations", () => {
    const res = evaluateInvitationRedemption(
      {
        status: "revoked",
        expiresAt: now + 3600_000,
      },
      "user@example.com",
      now
    );
    expect(res.valid).toBe(false);
    if (!res.valid) {
      expect(res.reason).toBe("REVOKED");
    }
  });

  it("enforces case-insensitive email match when invitedEmail is specified", () => {
    const mismatch = evaluateInvitationRedemption(
      {
        status: "pending",
        expiresAt: now + 3600_000,
        invitedEmail: "Nour@Example.com",
      },
      "someone-else@example.com",
      now
    );
    expect(mismatch.valid).toBe(false);
    if (!mismatch.valid) {
      expect(mismatch.reason).toBe("EMAIL_MISMATCH");
    }

    const matched = evaluateInvitationRedemption(
      {
        status: "pending",
        expiresAt: now + 3600_000,
        invitedEmail: "Nour@Example.com",
      },
      "nour@example.com",
      now
    );
    expect(matched.valid).toBe(true);
  });

  it("initializes all four presence settings to true by default per Section 6", () => {
    expect(createDefaultPresencePreferences()).toEqual({
      onlineStatus: true,
      lastSeen: true,
      readReceipts: true,
      typingIndicators: true,
    });
  });
});
