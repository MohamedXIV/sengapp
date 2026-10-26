import { z } from "zod";

export const createInvitationSchema = z.object({
  invitedEmail: z
    .string()
    .trim()
    .email("Please enter a valid email address.")
    .optional()
    .or(z.literal("")),
  note: z
    .string()
    .trim()
    .max(200, "Note must be 200 characters or fewer.")
    .optional()
    .or(z.literal("")),
  expiresInHours: z
    .number()
    .int()
    .min(1, "Minimum expiration is 1 hour.")
    .max(720, "Maximum expiration is 30 days (720 hours)."),
});

export const redeemInvitationSchema = z.object({
  rawToken: z
    .string()
    .trim()
    .min(16, "Invitation token is incomplete."),
  displayName: z
    .string()
    .trim()
    .min(1, "Display name is required.")
    .max(50, "Display name must be 50 characters or fewer."),
  handle: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      /^[a-z0-9_]{3,24}$/,
      "Handle must be 3–24 characters using lowercase letters, numbers, or underscores."
    ),
  locale: z.enum(["en", "ar"]),
});

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
export type RedeemInvitationInput = z.infer<typeof redeemInvitationSchema>;
