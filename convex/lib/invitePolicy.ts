import { ConvexError } from "convex/values";

export const MAX_PENDING_INVITES = 20;

export function assertInviteIssueAllowed(ttlHours: number, outstanding: number): void {
  if (!Number.isInteger(ttlHours) || ttlHours < 1 || ttlHours > 720) {
    throw new ConvexError({ code: "INVALID_EXPIRATION" });
  }
  if (outstanding >= MAX_PENDING_INVITES) {
    throw new ConvexError({ code: "INVITE_LIMIT_REACHED" });
  }
}
