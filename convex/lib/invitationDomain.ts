export interface InvitationRecordSnapshot {
  status: "pending" | "redeemed" | "revoked";
  expiresAt: number;
  invitedEmail?: string;
  redeemedByUserId?: string;
}

export type InvitationValidationFailureReason =
  | "NOT_FOUND"
  | "ALREADY_REDEEMED"
  | "REVOKED"
  | "EXPIRED"
  | "EMAIL_MISMATCH";

export type InvitationValidationResult =
  | { valid: true }
  | { valid: false; reason: InvitationValidationFailureReason; message: string };

/**
 * Pure domain validator for invitation lifecycle state transitions.
 * Used by both Convex mutations and deterministic unit tests.
 */
export function evaluateInvitationRedemption(
  invitation: InvitationRecordSnapshot | null,
  candidateEmail: string,
  nowMs: number
): InvitationValidationResult {
  if (!invitation) {
    return {
      valid: false,
      reason: "NOT_FOUND",
      message: "This invitation token does not exist.",
    };
  }

  if (invitation.status === "revoked") {
    return {
      valid: false,
      reason: "REVOKED",
      message: "This invitation has been revoked by an operator.",
    };
  }

  if (invitation.status === "redeemed" || invitation.redeemedByUserId) {
    return {
      valid: false,
      reason: "ALREADY_REDEEMED",
      message: "This invitation has already been used.",
    };
  }

  if (nowMs >= invitation.expiresAt) {
    return {
      valid: false,
      reason: "EXPIRED",
      message: "This invitation has expired.",
    };
  }

  if (
    invitation.invitedEmail &&
    invitation.invitedEmail.trim().toLowerCase() !==
      candidateEmail.trim().toLowerCase()
  ) {
    return {
      valid: false,
      reason: "EMAIL_MISMATCH",
      message: "This invitation is reserved for a different email address.",
    };
  }

  return { valid: true };
}

export function createDefaultPresencePreferences() {
  return {
    onlineStatus: true,
    lastSeen: true,
    readReceipts: true,
    typingIndicators: true,
  };
}
