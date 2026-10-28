import { ConvexError } from "convex/values";

export const MAX_PENDING_CONNECTION_INVITES = 10;
export const MAX_DAILY_CONNECTION_INVITES = 20;
export const CONNECTION_INVITE_TTL_HOURS = [24, 72, 168] as const;

export interface ConnectionInviteSnapshot {
  status: "pending" | "accepted" | "declined" | "revoked";
  expiresAt: number;
  issuerProfileId: string;
  recipientEmail?: string;
}

export function isConnectionCode(code: string): boolean {
  return /^[A-Za-z0-9_-]{43}$/.test(code);
}

export function canonicalPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

export function assertConnectionIssueAllowed(
  ttlHours: number,
  pendingCount: number,
  createdLastDay: number,
): void {
  if (!CONNECTION_INVITE_TTL_HOURS.some((ttl) => ttl === ttlHours)) {
    throw new ConvexError({ code: "INVALID_EXPIRATION" });
  }
  if (pendingCount >= MAX_PENDING_CONNECTION_INVITES || createdLastDay >= MAX_DAILY_CONNECTION_INVITES) {
    throw new ConvexError({ code: "INVITE_LIMIT_REACHED" });
  }
}

export function evaluateConnectionAcceptance(
  invite: ConnectionInviteSnapshot | null,
  candidateProfileId: string,
  candidateEmail: string,
  now: number,
  isBlocked: boolean,
  alreadyConnected: boolean,
):
  | { valid: true }
  | { valid: false; reason: "UNAVAILABLE" | "SELF_INVITE" | "EMAIL_MISMATCH" | "BLOCKED" | "ALREADY_CONNECTED" } {
  if (!invite || invite.status !== "pending" || now >= invite.expiresAt) {
    return { valid: false, reason: "UNAVAILABLE" };
  }
  if (invite.issuerProfileId === candidateProfileId) return { valid: false, reason: "SELF_INVITE" };
  if (invite.recipientEmail && invite.recipientEmail.toLowerCase() !== candidateEmail.trim().toLowerCase()) {
    return { valid: false, reason: "EMAIL_MISMATCH" };
  }
  if (isBlocked) return { valid: false, reason: "BLOCKED" };
  if (alreadyConnected) return { valid: false, reason: "ALREADY_CONNECTED" };
  return { valid: true };
}
