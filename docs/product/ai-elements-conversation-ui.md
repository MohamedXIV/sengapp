# Sengapp — AI Elements in shared conversations

**Status:** UI-only design demonstration on Draft PR #36, not implementation of agents, provider calls, recurring reminders or real consent. References: existing \`docs/product/vision.md\`, \`docs/product/roadmap.md\`, \`docs/architecture/overview.md\`, issue #8, and https://ui.shadcn.com/docs/ai-elements .

> **Backend selection note (2026-11-07):** The planned runtime is [Convex Agent Component with an optional AI Gateway](../architecture/adr/0003-permissioned-convex-agents.md). This is a proposed integration path only; this document's AI Elements are UI patterns and previews, not evidence of a deployed agent.

## Owner-chosen identity

Each user names their own Companion: a freely chosen **display name** (including Arabic) and a configurable **@mention alias**. No fixed product name, preset persona or universal nickname. Mentions must resolve to a specific companion ID owned by a user and authorized for that conversation; no text-only global identity match. In UI v2 this is temporary local demo state; in PR #37 Convex stores owner-scoped handle and displayName.

## Product invariant

**One conversation, multiple participant types.** Human DMs and groups remain primary. A named companion is accessible by mention from any chat UI, but it does not automatically become a member, read history, or execute work. Private owner work and group contexts are isolated. If member permissions are not confirmed, the invocation stays a blocked request, not an AI response.

Use the *same shadcn MessageScroller, Message, Bubble and InputGroup* for human and AI messages, with clearly labeled agent activity shown inline. Classic and Cozy render the same conversation components in different shells; never duplicate AI logic inside Dockview or Phaser.

## Official shadcn AI Elements inventory

These are **copyable patterns/compositions**, not a magic all-in-one npm package. Install upstream primitives through shadcn CLI / registry, then copy the relevant example composition into small typed product components, preserving normal shadcn variants and keyboard behavior. Do not apply another page-specific CSS skin.

| Pattern or primitive | Sengapp use | Adoption |
| --- | --- | --- |
| Chat, Message, Message Scroller, Bubble | Unified human and companion timeline | In baseline |
| Prompt Input / InputGroup / Attachment | Shared composer with @mention, files after media feature | Basic composer; attachment later |
| Tool, Task, Plan and Trace | Visible work, task progress and tool outcome | Demo Trace + plan/tool |
| Confirmation with Item | Explicit approvals before external effects | Demo Item approval only |
| Sources and Inline Citation | Links that the agent actually used | Source link in demo; citation metadata later |
| Suggestion | Tap-to-ask followups in same conversation | Next |
| Queue | Multiple tasks with status/history | Next |
| Checkpoint | Resume or inspect prior agent state | Later |
| Subagent | Child runs with known parent and permissions | Later |
| Context | Provider budget and context transparency | Later |
| Model Selector | Explicit owner-facing model/provider choice and costs | Later |
| Reasoning, Chain of Thought | **High-level activity summaries only**, never private provider internals | Later |
| File Tree, Terminal, Code Block, Stack Trace, Test Results | Typed tool outputs for coding/workflow companions | Later, only when a relevant tool is authorized |
| Questionnaire | Structured agent clarification when warranted | Later |
| scroll-fade / Marker | Conversation reading/navigation | Existing Marker, fade optional |

No feature should be force-rendered in every message. Capability is universal within the conversation renderer; display is event-driven. Coding tool panels need not clutter a normal family chat.

## Proposed typed event model (future backend; not implemented)

- \`human_message\`: existing authorized sender and message ID.
- \`companion_invocation\`: owner, companion ID, target conversation, initiating message, minimal authorized context scope, membership/consent snapshot.
- \`companion_message\`: clearly identified agent, provenance and provider metadata without exposing provider secrets.
- \`agent_task_update\` / \`tool_result\`: status and safe output payload, linked to an invocation.
- \`approval_request\` / \`approval_resolution\`: server-bound action ID, scope, requester, approver and expiry; approvals must be validated server-side.
- \`system_event\`: access denied, invitation pending, consent revoked, provider unavailable, budget exceeded.
- \`citation\` / \`attachment\`: authorization-aware resources, no public persistent document links.

The renderer should switch on a discriminated event type and lazy-load tool-specific UI. Keep domain events independent of the AI SDK and of any single provider. The preferred server execution path is Convex Agent (built on AI SDK-compatible models), guarded by a Sengapp authorization/event adapter. The AI SDK and shadcn helpers are not replacements for Convex membership rules; Convex AI Gateway is optional and currently paid-plan-only.

## Non-negotiable backend gates

1. Only active conversation members may initiate requests; verify ownership, blocks, group membership and approval for **all** relevant participants on the server.
2. Before consent, an agent gets no peer or group history. After consent, share only the context specifically authorized (e.g. the mention and intentionally selected prior messages); no silent cross-chat retrieval.
3. Companion memory and connected apps are **owner-private by default**. A group invocation never inherits the owner's private permissions. Tool execution requires separate scoped and expiring authorization.
4. Opt-out and removal prevent future reads/calls immediately. Cancellation, quotas, failures and any payment-impacting action are explicit events.
5. No proactive background access without separate opt-in. Provider requests, storage, retention, model use, audit without raw message leakage, and egress must be disclosed.
6. On an unavailable model/provider, show an explicit failed/paused status. Do not silently substitute another provider.
7. No claims of E2EE for the current architecture. Do not store sensitive provider credentials in client components.

## UI gate for this iteration

The existing **UI v2 design** remains based on the official shadcn Chat demo and sidebar-08 block, without extending \`studio.css\` or the old appearance system. The local preview shows an agent inside a real-looking message stream, a Trace-based sample task, a source link and a non-executing confirmation card. Once the owner chooses a display name and @mention alias in the demo, that alias is available in every composer; only mock consent gates the illustrative reply. No product-level default Companion identity exists.

Before real agent work, validate roles and permissions at the Convex boundary, create a request/response event contract, and add multi-account negative-access tests. After that, layer in additional documented AI Elements only when their corresponding data contract exists.
