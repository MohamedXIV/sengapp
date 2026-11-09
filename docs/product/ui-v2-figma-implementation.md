# Sengapp Classic + Cozy — UI v2 implementation ledger (Draft)

> **Last reviewed: 9 November 2026.** This is an implementation snapshot, not the feature roadmap. For the design decisions and ordered next batches see [UI v2 Design Roadmap](ui-v2-design-roadmap.md). [Draft PR #38](https://github.com/MohamedXIV/sengapp/pull/38) is stacked on [Draft PR #36](https://github.com/MohamedXIV/sengapp/pull/36); neither is merged into `main`.

## Actual shared architecture

- `WorkspaceProvider` holds selected conversation, local demo messages/draft, owner-set companion identity, mock consent state and scoped UI v2 appearance state across shell switches.
- `SharedConversationPanel` uses native shadcn Card, MessageScroller, Message/Bubble/Marker, InputGroup and inline demo agent activity. It renders unchanged as content inside Classic and the Cozy desktop/mobile windows.
- **Classic:** official `sidebar-08` composition with the shared conversation and a compact header; utility settings do not consume content width.
- **Cozy desktop:** real Phaser 4 room renderer fills the stage behind Dockview independent Chats and Conversation windows. Dockview remains in charge of window drag/resize/tabs; empty space is click-through to Phaser while window controls receive pointer input.
- **Cozy mobile:** touch-capable chat window and shadcn Sheet for the chat list; shared right settings Sheet for appearance and companion.
- `AppearancePanel` currently exposes four *fixed* accents, three radius levels and three shadow levels, persisted locally. The owner has now explicitly approved **arbitrary** colors, separate surface/background roles, localization and Light/Dark/System: these are **B2/B7 future work**, not already delivered features.

## B1 cleanup implemented on this Draft

1. Chat header reduced to avatar, conversation name, small subtitle. Chat-level **New conversation** and **Name/Edit companion** actions removed from header.
2. Shared floating/elevated shadcn InputGroup composer, modest width and shadow. Dynamic focus enlargement and send/reaction motion remain upcoming.
3. One **right overlay Sheet** on desktop and mobile, not a push-sidebar. It contains Appearance and a centralized Companion identity form (display name + @alias). Other companion customization is future scope.
4. Classic demo footer removed; user settings menu links to the right overlay; Cozy mobile reuses the same drawer.

**Still mock-only:** No authorized Clerk/Convex messaging data, account-synced preferences, real companion consent, AI provider, background agent, or saved AI identity in production. The recent art mockups are visual proposals rather than pixel-perfect implementation contracts.

## Verification and status

- Current Draft PR #38 head at this review: `daa86c7a88fca8d706a6c30c621cae3495f565d0` before documentation-only commits.
- Vercel built that code and reported READY; **visual acceptance is separate**.
- On [CI run 42620830746](https://github.com/MohamedXIV/sengapp/actions/runs/42620830746), TypeScript, lint, Vitest/domain tests and Next.js build **passed**, while Playwright **failed** because `tests/e2e/ui-v2-messages.spec.ts` still clicks removed chat-header actions or expects the removed companion alias chip. Update tests to the current utility Sheet and rerun desktop + mobile, then obtain user visual sign-off. Do not describe the entire suite as green.
- B2+ are **planned**; localization, unrestricted palette and Dark/System behavior are not yet wired to UI v2.
- Keep PR Draft until visual, responsive, accessibility, reduced-motion and test acceptance. All security/backend integration remains separately reviewed.

## Historical context

The implementation used [approved Figma exploration screens](https://www.figma.com/design/FrKROxJwOl0PWQnZLo7Oj9) as visual reference, not a verified pixel-perfect import. The clean-room foundation used official shadcn compositions; later design feedback asks for much more warmth, color and personality **without** undoing native shadcn semantics. Old accounts/legacy preview code and stacked backend PRs are not source styling for UI v2.
