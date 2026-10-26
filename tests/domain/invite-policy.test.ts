import { describe, expect, it } from "vitest";
import { assertInviteIssueAllowed } from "../../convex/lib/invitePolicy";

describe("Operator invitation limits", () => {
  it("rejects short, fractional or excessive TTLs", () => {
    expect(() => assertInviteIssueAllowed(0, 0)).toThrowError();
    expect(() => assertInviteIssueAllowed(1.5, 0)).toThrowError();
    expect(() => assertInviteIssueAllowed(721, 0)).toThrowError();
  });

  it("limits outstanding invitations per operator", () => {
    expect(() => assertInviteIssueAllowed(72, 20)).toThrowError();
    expect(() => assertInviteIssueAllowed(72, 19)).not.toThrowError();
  });
});
