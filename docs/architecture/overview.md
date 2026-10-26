# Architecture Overview (planned)

**Backend choice:** Convex-first, agreed on 2026-10-26. **Implementation status:** not scaffolded.

## Major boundaries

- **Next.js / React:** browser UI, routing, message rendering, PWA, accessible chat controls.
- **Convex:** application state, reactive queries, mutations, conversation membership enforcement, invitations, notifications metadata and companion permissions.
- **PixiJS:** an optional transparent mascot/visual layer; never the canonical text renderer.
- **AI integration:** server-side provider abstraction, opt-in prompt context, per-user budgets, provider secrets and companion authorization.
- **Media:** an application-owned attachment interface; file metadata and access checks belong to the server.

## Baseline stack

Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, Convex, PixiJS (with React integration when needed), Zod, Zustand for local-only UI state, AI SDK, Vitest, Playwright.

Do not add a second database until there is an established need. Avoid a monolith without splitting every small helper into a separate file.

## Authoritative access rules

1. An authenticated user may read messages and attachments only in conversations where their current membership and history policy authorize access.
2. Joining, leaving, removal and role changes are enforced server-side and reflected in all queries, actions and subscriptions.
3. An AI companion is owned by a user, not by a group. Group participation and disclosed context require explicit approval.
4. Client controls, hiding UI elements and obscure document IDs are never used as authorization.
5. Do not distribute long-lived, publicly accessible file URLs as if they were membership-protected.

## Conceptual domains

Identity & Invitations · Conversations & Members · Messages & Reactions · Attachments · Presence & Read Positions · User Preferences · Companions & Permissions · AI Usage Budgets.

See [ADR 0001](adr/0001-convex-first.md) for the backend decision and the [approved v0.1 design](../specs/sengapp-v0.1-design.md) for proposed entities and acceptance criteria.
