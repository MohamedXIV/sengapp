# Sengapp UI v2 — vanilla shadcn baseline

## Reset decision

The layered UI v2 Design Studio was rejected. This revision deletes its components, old page-specific CSS, appearance playground, and hand-authored visual system instead of covering them with additional overrides.

## Included

- A fresh /ui-v2 route using the installed official shadcn Sidebar, Message, Bubble, MessageScroller, Marker, Avatar, Badge, Separator, and InputGroup.
- No className or style props on chat primitives and no new page-specific CSS. Tailwind only positions structural containers (flex, height, padding, overflow).
- Existing global project shadcn theme variables still supply the baseline palette; the route does not introduce another theme or token layer.
- Three mock conversations with both English and Arabic messages, and a local-only Send interaction.

## Intentionally absent

Appearance customization, reactions, replies, editing, deleting, profile menus, overlays, AI transport, and backend adapters are deferred until the owner accepts the default component appearance.

## Isolation

Nothing on the /ui-v2 route reads from Clerk or Convex, writes to production, or imports the old Classic or Cozy UI. The main branch and production routes remain unchanged.

CI validates component composition and desktop/mobile behavior. Passing CI is not visual approval.
