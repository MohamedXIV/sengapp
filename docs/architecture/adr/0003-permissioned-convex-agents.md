# ADR 0003 — Permissioned AI Companions via Convex Agent; Gateway Optional

**Date:** 2026-11-07  
**Status:** Proposed technical architecture; agreed product direction. **Not implemented or approved for production.**  
**Depends on:** [ADR 0001 — Convex-first](0001-convex-first.md), [Product Vision](../../product/vision.md), [AI Elements conversation model](../../product/ai-elements-conversation-ui.md), [Issue #8](https://github.com/MohamedXIV/sengapp/issues/8), and UI v2 [Draft PR #36](https://github.com/MohamedXIV/sengapp/pull/36).

## Context

Sengapp is a private-circle messenger where humans and **permissioned AI companions may participate inside the same DMs/groups and share the same conversation UI**. Companions can be mentioned, answer, display ongoing tasks, request approval, and eventually perform explicitly authorized tasks. They are not a separate chatbot product; however, a useful human conversation must never require running AI.

Existing \`main\` has Clerk identity and Convex \`conversations\`, \`conversationMembers\`, \`messages\`, direct-chat block checks and group membership/history gates. Preserve those existing security contracts and canonical human message identifiers. PR #36 currently renders only **mock** companion data and in-memory approvals. No genuine AI backend, consent records, or provider calls exist there yet.

## Decision for the next implementation spike

1. **Keep Sengapp's Convex conversation domain authoritative.** Existing message IDs, membership, block state, history permissions, user-facing timeline and read receipts remain application-owned. Do **not** replace the messenger database with \`@convex-dev/agent\` threads or create a second canonical copy of human conversations.
2. **Adopt \`@convex-dev/agent\` as the preferred companion execution component** (pending a small, isolated proof): agent-specific threads/context, persistence of LLM/tool events, streaming, tool loops, usage accounting. Map invocations/events into Sengapp's conversation renderer using stable IDs. Agent-internal message storage is not a substitute for the application's authorization or canonical chat history.
3. **Use explicit, narrow scope per invocation.** A mention creates a request, not membership or automatic disclosure. Server-side authorization checks active membership, applicable blocks, per-conversation companion consent, context range, revocation and tool scope before *any* context is given to the model. Do not allow background/search defaults to retrieve other threads or owner-private memories. Separate private owner-agent threads from shared group/DM contexts.
4. **Keep the AI provider replaceable.** The first proof can call a provider directly using a server-only secret and AI SDK-compatible model via Convex actions. **Convex AI Gateway is optional**, never a requirement for Free-tier development. Official documentation currently makes Gateway available to **paid Convex teams**, whereas the Agent component can use a direct provider integration without Gateway.
5. **Present AI and human activity with shadcn UI in the same timeline**: \`Message\`, \`Bubble\`, \`MessageScroller\`, \`InputGroup\`, and event-driven AI Elements such as \`Trace\`, \`Tool\`, \`Confirmation\`, \`Sources\`. Don't display every agent widget in every message. No extra CSS skins; use the official shadcn components/patterns first.
6. **Separate demonstration helpers from the runtime.** \`@shadcn/helpers/ai-sdk\` may produce deterministic stream/tool fixtures in tests and UI previews. It is *not* the authorization layer or live model connection. TanStack AI helper is an alternative if the transport choice changes, not an additional runtime dependency required now.
7. **No unsupported claims of autonomous/durable execution.** Scheduled tasks or recoverable multi-step work need an explicit persisted task model, Convex scheduling or Workflow Component as appropriate, cancellation, retry/idempotency semantics, cost controls, and real delivery. An illustrative reminder approval does not schedule anything.

## Architecture boundaries (proposed)

\`\`\`text
Next.js / React
  shadcn Chat, AI Elements, shared Classic/Cozy conversation UI
        |
Convex Sengapp domain (authoritative)
  Auth + DM/group authorization + consent + messages + audit + usage limits
        |
  Companion invocation adapter (new; not yet implemented)
  - stable conversationMessageId / invocationId / companionId
  - minimal context construction and explicit approved disclosure
  - cancellation / error / approval state + linked event records
        |
@convex-dev/agent
  scoped agent thread + AI SDK-compatible model + tools + stream deltas
        |
  Provider adapter
  Direct provider secret (first proof) OR Convex AI Gateway (paid, optional)
\`\`\`

**Important data principle:** The messenger owns messages the users see. The Agent component may retain separate operational thread records required to generate replies and stream chunks; store linkage/provenance, avoid mirroring entire human histories, and enforce access controls at every crossing. Do not grant group or DM membership merely because an Agent thread exists. Never render raw tool credentials or private chain-of-thought.

## First concrete integration slice — not started

1. **Approve the UI baseline:** PR #36 stays Draft until visual, desktop/mobile and RTL acceptance. Its consent/approval UI is mock state and cannot be mistaken for real authorization.
2. **Specify minimal typed event contract** (\`invocation_requested\`, \`invocation_denied\`, \`assistant_delta\`, \`assistant_message\`, \`tool_requested\`, \`approval_requested\`, \`approval_resolved\`, \`task_failed\`/\`task_cancelled\`) and identity mapping to existing messages. Clarify which events persist vs. derive from Agent output.
3. **Define and test permissions before model calls:** authenticated requester, group/DM participation, block/revocation, companion ownership, participant opt-in, explicit message scope and tool-level approvals. Negative multi-account tests are required; client state is never a permission source.
4. **Create an isolated POC on a new branch** with \`@convex-dev/agent\`, one server-side provider and a single read-only mention→response action. Make the first AI result appear inside the existing shadcn conversation stream; do not modify old message schema destructively. No generalized RAG or owner memory in first slice.
5. **Add safe streaming**, reconnection, dedupe/idempotency, failure and cancellation; verify separate permissions for each stream subscriber and no newly joined member can see unauthorized history.
6. **Only then implement one controlled tool**, e.g. a reminder proposal with explicit approval and real persisted schedule. Never execute side effects from UI approval alone.
7. **Measure cost and mobile behavior**, establish per-user caps/rate limits/observability, model fallback policy, and a provider-data notice before wider alpha.

## Alternatives and reasons

| Option | Decision |
| --- | --- |
| Hand-build full threads, tools, memory and streaming in Convex | Not preferred; duplicates maintained Agent Component capabilities and increases operational/permission complexity |
| Make Agent Component the single messages backend | Rejected for the first implementation; Sengapp already has canonical secure DMs/groups and existing history access rules |
| Require Convex AI Gateway | Rejected as a requirement because it needs a paid plan; consider later for consolidated credentials/billing |
| Use AI SDK / TanStack AI UI hook as the sole app backend | Not a replacement for Convex membership/permissions and durable chat state; can serve as transport/test-layer only |
| Put agents in an isolated AI chat route | Rejected; product vision is companions in permissioned human conversation contexts |

## Open decisions to validate in the proof

- Exact participant consent and revocation policy (including how new group members affect existing approval), consent history and administrative UX.
- Whether agent execution threads are per-invocation, per-consented conversation+companion, or scoped differently; choose by privacy isolation before optimizing token reuse.
- Provider/model, context/token budget, rate limits, allowed costs, data retention and opt-in disclosure.
- How edited/deleted or before-join messages affect agent context, stored summaries, tool results and searchable embeddings.
- Prompt-injection boundaries for user-supplied text, sources and connected tools.
- Scheduling and notifications for genuine reminders, with retries and revocation.

## References (verified 2026-11-07)

- https://docs.convex.dev/agents/overview
- https://docs.convex.dev/agents/threads
- https://docs.convex.dev/agents/agent-usage
- https://docs.convex.dev/agents/context
- https://docs.convex.dev/agents/tools
- https://docs.convex.dev/agents/streaming
- https://docs.convex.dev/agents/workflows
- https://docs.convex.dev/ai-gateway/overview
- https://ui.shadcn.com/docs/ai-elements
- https://ui.shadcn.com/docs/helpers/ai-sdk
- https://ui.shadcn.com/docs/helpers/tanstack-ai

This ADR is a **plan, not a claim of an installed component, paid gateway access, or authorized live agent behavior**.
