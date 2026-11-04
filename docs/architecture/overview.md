# Architecture Overview (planned)

**Backend choice:** Convex-first, agreed 2026-10-26; P0/P1 scaffolded and implemented on unmerged Draft PRs. **Updated visual direction:** 2026-10-31 (ADR 0002); Phaser/Dockview experiment is not Production.

## Major boundaries

- **Next.js / React:** browser UI, routing, message rendering, PWA, accessible chat controls.
- **Convex:** application state, reactive queries, mutations, conversation membership enforcement, invitations, notifications metadata and companion permissions.
- **Phaser 4 (experimental):** one optional full-screen 2D isometric scene and landscape world; a room is a smaller collection of world-space sprites, not the screen. Does not render canonical chat text.
- **Dockview React (experimental):** floating/resize/dockable accessible React chat/tool panels, with touch-first phone alternatives; still ordinary DOM.
- **Companion presentation (future):** optional shared character state and a transparent overlay across DOM panels; not necessarily PixiJS and never an AI authorization mechanism.
- **AI integration:** server-side provider abstraction, opt-in prompt context, per-user budgets, provider secrets and companion authorization.
- **Media:** an application-owned attachment interface; file metadata and access checks belong to the server.

## Baseline stack

Next.js App Router, React 19, TypeScript, Tailwind CSS, shadcn/ui, Clerk, Convex, Zod, Vitest and Playwright. Phaser 4 and Dockview React are experimental dependencies in Draft PR #20; do not presume their integration is already shipped. Avoid adding Zustand without a concrete UI state problem; AI SDK only when a permissioned companion phase actually begins.

Do not add a second database until there is an established need. Avoid a monolith without splitting every small helper into a separate file.

## Authoritative access rules

1. An authenticated user may read messages and attachments only in conversations where their current membership and history policy authorize access.
2. Joining, leaving, removal and role changes are enforced server-side and reflected in all queries, actions and subscriptions.
3. An AI companion is owned by a user, not by a group. Group participation and disclosed context require explicit approval.
4. Client controls, hiding UI elements and obscure document IDs are never used as authorization.
5. Do not distribute long-lived, publicly accessible file URLs as if they were membership-protected.

## Conceptual domains

Identity & Invitations · Conversations & Members · Messages & Reactions · Attachments · Presence & Read Positions · User Preferences · Companions & Permissions · AI Usage Budgets.

See [ADR 0001](adr/0001-convex-first.md) and [ADR 0002](adr/0002-personal-world-and-workspace.md) for the backend decision and the [approved v0.1 design](../specs/sengapp-v0.1-design.md) for proposed entities and acceptance criteria.
