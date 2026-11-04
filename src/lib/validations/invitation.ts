import { z } from "zod";

export const createConnectionInviteSchema = z.object({
  recipientEmail: z.string().trim().email("Enter a valid email address.").optional().or(z.literal("")),
  note: z.string().trim().max(200, "Note must be 200 characters or fewer.").optional().or(z.literal("")),
  ttlHours: z.union([z.literal(24), z.literal(72), z.literal(168)]),
});

export type CreateConnectionInviteInput = z.infer<typeof createConnectionInviteSchema>;
