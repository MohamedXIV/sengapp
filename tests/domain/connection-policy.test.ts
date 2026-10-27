import { describe, expect, it } from "vitest";
import {
  assertConnectionIssueAllowed, evaluateConnectionAcceptance,
  isConnectionCode, canonicalPair, type ConnectionInviteSnapshot,
} from "../../convex/lib/connectionPolicy";

const pending: ConnectionInviteSnapshot = {
  status: "pending", expiresAt: 1_000, issuerProfileId: "alice",
};

describe("Private connection invitation policy", () => {
  it("requires canonical 32-byte base64url codes and fixed expiry choices", () => {
    expect(isConnectionCode("A".repeat(43))).toBe(true);
    expect(isConnectionCode("A".repeat(42))).toBe(false);
    expect(isConnectionCode("A".repeat(42) + "+")).toBe(false);
    expect(() => assertConnectionIssueAllowed(72, 0, 0)).not.toThrow();
    expect(() => assertConnectionIssueAllowed(1, 0, 0)).toThrow();
    expect(() => assertConnectionIssueAllowed(24, 10, 0)).toThrow();
    expect(() => assertConnectionIssueAllowed(24, 0, 20)).toThrow();
  });

  it("uses canonical unordered pairs", () => {
    expect(canonicalPair("bob", "alice")).toEqual(["alice", "bob"]);
    expect(canonicalPair("alice", "bob")).toEqual(["alice", "bob"]);
  });

  it("accepts a valid nonself unblocked fresh invitation", () => {
    expect(evaluateConnectionAcceptance(pending, "bob", "bob@example.com", 999, false, false))
      .toEqual({ valid: true });
  });

  it.each([
    [{ ...pending, status: "revoked" as const }, "bob", "bob@example.com", 999, false, false, "UNAVAILABLE"],
    [{ ...pending, status: "accepted" as const }, "bob", "bob@example.com", 999, false, false, "UNAVAILABLE"],
    [{ ...pending, status: "declined" as const }, "bob", "bob@example.com", 999, false, false, "UNAVAILABLE"],
    [pending, "bob", "bob@example.com", 1000, false, false, "UNAVAILABLE"],
    [pending, "alice", "alice@example.com", 999, false, false, "SELF_INVITE"],
    [{ ...pending, recipientEmail: "chosen@example.com" }, "bob", "wrong@example.com", 999, false, false, "EMAIL_MISMATCH"],
    [pending, "bob", "bob@example.com", 999, true, false, "BLOCKED"],
    [pending, "bob", "bob@example.com", 999, false, true, "ALREADY_CONNECTED"],
  ] as const)("rejects invalid, blocked or duplicate connections", (invite, profileId, email, now, blocked, connected, reason) => {
    expect(evaluateConnectionAcceptance(invite, profileId, email, now, blocked, connected))
      .toEqual({ valid: false, reason });
  });
});
