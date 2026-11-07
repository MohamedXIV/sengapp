import { v, type Infer } from "convex/values";

/**
 * Product-facing events (not provider protocol). This is an event contract,
 * NOT an executable AI SDK, tool dispatcher, message-store migration or queue.
 * No raw private reasoning, secrets or cross-chat context payloads.
 */
export const companionEventValidator = v.union(
  v.object({
    kind: v.literal("invocation_validated"),
    invocationId: v.id("companionInvocations"),
    conversationId: v.id("conversations"),
    sourceMessageId: v.id("messages"),
  }),
  v.object({
    kind: v.literal("invocation_denied"),
    conversationId: v.id("conversations"),
    reason: v.union(v.literal("consent_required"), v.literal("access_revoked"), v.literal("provider_unavailable")),
  }),
  v.object({
    kind: v.literal("assistant_delta"),
    invocationId: v.id("companionInvocations"),
    sequence: v.number(),
    text: v.string(),
  }),
  v.object({
    kind: v.literal("assistant_message"),
    invocationId: v.id("companionInvocations"),
    messageId: v.string(),
    text: v.string(),
  }),
  v.object({
    kind: v.literal("tool_status"),
    invocationId: v.id("companionInvocations"),
    toolCallId: v.string(),
    status: v.union(v.literal("requested"), v.literal("running"), v.literal("succeeded"), v.literal("failed")),
  }),
  v.object({
    kind: v.literal("approval_requested"),
    invocationId: v.id("companionInvocations"),
    approvalId: v.string(),
    summary: v.string(),
    expiresAt: v.number(),
  }),
  v.object({
    kind: v.literal("approval_resolved"),
    invocationId: v.id("companionInvocations"),
    approvalId: v.string(),
    decision: v.union(v.literal("approved"), v.literal("denied")),
  }),
  v.object({
    kind: v.literal("invocation_finished"),
    invocationId: v.id("companionInvocations"),
    outcome: v.union(v.literal("completed"), v.literal("failed"), v.literal("cancelled")),
  }),
);

export type CompanionEvent = Infer<typeof companionEventValidator>;
