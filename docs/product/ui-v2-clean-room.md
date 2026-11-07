# Sengapp UI v2 — official shadcn block composition

The first "vanilla" experiment was too bare because it copied individual primitives, not the actual layout and shell of the official examples. This iteration is grounded in two authored upstream compositions:

- Official \`sidebar-08\` block: AppSidebar + NavMain + NavProjects + NavSecondary + NavUser. Sengapp labels and local click callbacks replace the demo's Acme/Project data, while the original structure and utility classes remain.
- Official \`chat-demo\` and \`message-scroller-group-chat\` examples: bounded chat Card, explicit header, Empty state, MessageScroller, Message/Bubble variants, and the InputGroup composer with an attachment menu and Send action. Agent and AI SDK features are omitted because Sengapp is a human-to-human messenger.

The old global Sengapp theme uses warm custom HSL tokens and lacks the popup tokens required by modern primitives. The UI v2-only \`shadcn-theme.css\` restores a single familiar stock shadcn light palette for the baseline without styling individual components or affecting main routes.

All conversations and sends are local demo state. No Convex/Clerk/AI SDK integration is present. Main branch and production UI remain unchanged. The PR remains Draft until visual signoff.
