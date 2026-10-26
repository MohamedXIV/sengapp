import { describe, expect, it } from "vitest";
import {
  assertActiveMemberActor,
  assertOperatorActor,
  isAllowedVerifiedOperator,
  type AuthenticatedActor,
} from "../../convex/lib/permissions";

describe("Server-Side Authorization Guards", () => {
  it("blocks unauthenticated actors", () => {
    expect(() => assertActiveMemberActor(null)).toThrowError();
  });

  it("blocks users who have not yet redeemed an invitation", () => {
    const pendingUser: AuthenticatedActor = {
      role: "member",
      status: "pending_invite",
    };

    expect(() => assertActiveMemberActor(pendingUser)).toThrowError();
  });

  it("blocks suspended users even if they previously held operator role", () => {
    const suspendedOperator: AuthenticatedActor = {
      role: "operator",
      status: "suspended",
    };

    expect(() => assertOperatorActor(suspendedOperator)).toThrowError();
  });

  it("blocks active regular members from operator-only mutations", () => {
    const regularMember: AuthenticatedActor = {
      role: "member",
      status: "active",
    };

    expect(() => assertOperatorActor(regularMember)).toThrowError();
  });

  it("permits active operators on operator-only mutations", () => {
    const activeOperator: AuthenticatedActor = {
      role: "operator",
      status: "active",
    };

    expect(assertOperatorActor(activeOperator)).toEqual(activeOperator);
  });

  it("refuses an unverified operator email even when it matches the server allowlist", () => {
    expect(isAllowedVerifiedOperator("owner@example.com", false, "owner@example.com")).toBe(false);
    expect(isAllowedVerifiedOperator("owner@example.com", true, undefined)).toBe(false);
    expect(isAllowedVerifiedOperator("OTHER@example.com", true, "owner@example.com")).toBe(false);
    expect(isAllowedVerifiedOperator("OWNER@example.com", true, "owner@example.com")).toBe(true);
  });
});
