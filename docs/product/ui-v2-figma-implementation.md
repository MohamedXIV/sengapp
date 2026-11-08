# Sengapp Classic + Cozy — Figma implementation (UI-only)

This batch implements the approved [four Figma exploration screens](https://www.figma.com/design/FrKROxJwOl0PWQnZLo7Oj9) on top of the shadcn UI v2 Draft PR #36, on a separate Draft PR #38. **It does not integrate Convex, Clerk, Agent Component or the private permission contracts of Draft PR #37.**

## Composition

- One \`WorkspaceProvider\` retains selected conversation, draft/messages, local mock companion identity and consent decisions while users change shells.
- One \`SharedConversationPanel\` wraps official shadcn Card, MessageScroller/Message/Bubble/Marker, InputGroup composer and inline agent activity.
- One \`AppearancePanel\` controls semantic accent tokens, radius and elevation for both shells. UI-only settings persist in localStorage for preview convenience; account customization follows later.
- Classic is a shadcn Sidebar-08 layout with a full-height chat panel and optional Appearance side panel.
- Cozy uses the **actual existing Phaser 4** forest cottage RoomCanvas and an overlay of **real Dockview** independent floating Chats, Conversation and Appearance panels. Dockview controls the tabs, floating positions, docking, resize and grouping; its renderer does not own or duplicate message components.
- Cozy mobile uses the same conversation panel inside a bounded touch drag/resize window, plus shadcn Sheets for Chats and Appearance. Future work may unify mobile window docking and persistence with the desktop Dockview workspace.

## Boundaries

The world is not a background wallpaper; the Phaser renderer occupies the full viewport behind the floating panels. All content is mock/local-only. Companion aliases are chosen by the user, not hardcoded product defaults; no model or tool executes.

The theme has four accents (sage, rose, lavender, honey), three corner settings and three shadow settings. It is scoped with \`body:has([data-sengapp-shadcn-blocks])\` and does not modify the classic production UI.

Figma Starter MCP reached its tool-call quota during code extraction, so this is a **reference-guided first implementation**, not a pixel-perfect export. Visual desktop and mobile reviews against the approved Figma screens are still required.

## Validation / acceptance

- TypeScript, lint, full Vitest regressions, Next.js build and desktop/mobile Playwright.
- Same messages and owner-selected companion identity remain intact across the Classic ↔ Cozy switch.
- Desktop Cozy panels are true Dockview instances with movable tabs/resize; mobile windows support touch handles.
- Tokens persist across switches; no broad old CSS overrides, no extra route per room, and no production data egress.

Next step after approval: refine Figma parity and responsive ergonomics; then integrate the existing authorized Convex messaging data into the same shared components in a separate, security-reviewed PR.
