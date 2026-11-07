# Sengapp UI v2 — official shadcn block composition

The first "vanilla" experiment was too bare because it copied individual primitives, not the actual layout and shell of the official examples. This iteration is grounded in two authored upstream compositions:

- Official \`sidebar-08\` block: AppSidebar + NavMain + NavProjects + NavSecondary + NavUser. Sengapp labels and local click callbacks replace the demo's Acme/Project data, while the original structure and utility classes remain.
- Official \`chat-demo\` and \`message-scroller-group-chat\` examples: bounded chat Card, explicit header, Empty state, MessageScroller, Message/Bubble variants, and the InputGroup composer with an attachment menu and Send action. The foundation is a shared human + AI companion conversation experience; real agent backends and provider calls are omitted because they are not authorized/implemented yet, not because AI is a separate chat product.

The old global Sengapp theme uses warm custom HSL tokens and lacks the popup tokens required by modern primitives. The UI v2-only \`shadcn-theme.css\` restores a single familiar stock shadcn light palette for the baseline without styling individual components or affecting main routes.

All conversations and sends are local demo state. No Convex/Clerk/AI SDK integration is present. Main branch and production UI remain unchanged. The PR remains Draft until visual signoff.


## AI companions are part of conversations, not a second product UI

The existing approved vision supports named companions in private and explicitly approved group chats. A UI-only example now uses human and agent entries in the same MessageScroller; shadcn Trace and Item provide activity/approval surfaces. The composer permits the owner's chosen `@alias` from **every** conversation, but only the fictitious `team` sample has mock consent. Other peer/group conversations display a blocked request with no agent output. This is **not real consent**, no AI provider runs, and no real background reminder is created. Everything remains in component state.

See [AI Elements adoption and authorization architecture](ai-elements-conversation-ui.md) for the complete pattern inventory and required server-side trust boundaries.

## Companion backend decision

See [ADR 0003 — Convex Agent with optional Gateway](../architecture/adr/0003-permissioned-convex-agents.md). The UI v2 demo uses a fictitious agent and mock approvals only; the planned server integration and permission gates are **not** implemented here.

## Companion identity is owner-defined

UI v2 starts without a named AI agent. The owner uses a native shadcn Dialog to choose (and edit) display name and @mention handle, then the example agent event appears. The selection is local preview state only. In the real app, Convex PR #37 stores owner-scoped `handle` and `displayName`.
