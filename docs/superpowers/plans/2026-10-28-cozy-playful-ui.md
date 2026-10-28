# Cozy & Playful Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the approved Sengapp Cozy & Playful visual direction for its real Phase 0 screens.

**Architecture:** Reuse existing shadcn Sidebar/Card/Button/Sheet and personal theme tokens. A single shell handles direction and navigation, while page components own their empty states. Styling uses semantic colors rather than independent per-theme copies.

**Tech Stack:** Next.js 16, React 19, TS 6, Tailwind v4, shadcn/ui, next-intl, Convex and Clerk unchanged, Vitest and Playwright.

**Spec:** `docs/specs/2026-10-28-cozy-playful-ui.md`

**Execution:** Three coherent commits delivered to Draft PR #10; final small mobile-dismiss regression follows. Build runs in Vercel Preview because the local sandbox prohibits Turbopack's localhost process binding.

**Rulings:**
- Task 1: Keep the four-item navigation declaration local to the shell; only direction/active-route helpers need a reusable interface. Cost if wrong: extract the nav data later when another consumer appears.
- Task 2: Existing `getThemeTokens` already maps every preset/accent to shadcn semantics, so leave its implementation intact. Cost if wrong: revisit preset values after real visual review.
- Task 3: Local `next build` exits on `Operation not permitted` while creating a CSS worker port, even under a sandbox escalation. Verify production compilation through exact-head Vercel Preview instead. Cost: local build parity remains unverified in this runtime.

## Global Constraints

- Draft PR #10 only; no Production or DB edits.
- No fake messenger or companion features in Phase 0.
- Arabic RTL right, English LTR left; same physical placement on mobile.
- Keep all per-account theme preferences, reduced motion and accessibility.
- Shadcn-first; custom pieces only for Sengapp-specific illustration/composition.

## Review Focus

- Arabic on narrow viewport: side panel slides from physical right, never left. Task 1 checks the resulting variant rules.
- Desktop navigation between page and hash anchors: correct active selection. Task 1 tests matching logic.
- Unknown future route: don't highlight a misleading nav item. Task 1 tests fallback.
- Theme preview/default and dark palette: shell consumes semantic CSS tokens. Task 2 tests personalized token coverage.
- One-shot invite state during UI reorganization: existing copy, share, and consumed-token tests remain green. Task 3 runs those tests.

---

### Task 1: Directional floating navigation

**Files:**
- Modify: `src/components/layout/app-shell.tsx`, `src/components/ui/sheet.tsx`, `src/components/ui/sidebar.tsx`
- Create: `src/components/layout/navigation.ts`, `tests/components/cozy-navigation.test.tsx`

**Interfaces:**
- Produces `getNavigationItems(role, t)` and `isNavigationItemActive(pathname, href)` for shell and tests.
- Consumes existing Shadcn Sidebar/Sheet and next-intl Navigation catalog.

- [x] Write tests for active and inactive routes, RTL/LTR desktop Sidebar side/variant and mobile Sheet physical side classes.
- [x] Run `npx vitest run tests/components/cozy-navigation.test.tsx` and confirm test-first failures.
- [x] Implement navigation helpers, floating sidebar shell and physical side handling with existing Shadcn components. Use project brand mark and localized nav labels.
- [x] Run focused tests, `npm test`, lint and typecheck; inspect actual results.
- [x] Commit through connected GitHub connector to the canonical PR #10 branch.

### Task 2: Warm theme-aware Home and shell surfaces

**Files:**
- Modify: `src/app/home/page.tsx`, `src/app/globals.css`, `src/lib/themes/presets.ts`, `messages/en.json`, `messages/ar.json`
- Create: `src/components/brand/cozy-mark.tsx`, `tests/components/cozy-home.test.tsx`

**Interfaces:**
- Consumes semantic theme variables; Home receives `{name,operator}` from verified `MemberGate`.
- Produces `<CozyMark />` and a translation-backed Home empty state with real links.

- [x] Write tests that welcome a real named member and offer actual Connections/Profile links without fake conversation actions.
- [x] Run focused test red; build the presentational Home component, decorative code-native mark, and semantic CSS shell surfaces.
- [x] Add warm Arabic/English Home strings and ensure RTL readability.
- [x] Verify focused tests, theme token tests, full suite, lint/typecheck.
- [x] Commit through connected GitHub connector.

### Task 3: Cohesive Connections, invites and Settings

**Files:**
- Modify: `src/app/connections/page.tsx`, `src/features/connections/create-connection-invite.tsx`, `src/app/settings/profile/page.tsx`
- Test: `tests/components/share-invite.test.tsx`, `tests/integration/connections.test.ts`

**Interfaces:**
- Consumes existing Convex invite actions and personal appearance controls unchanged.
- Produces coherent Card-based connected/empty states and invitation panels.

- [x] Add a behavior assertion on empty contact state and contact list rendering (not a data-layer mock-up).
- [x] Verify the test fails before the visual page change.
- [x] Implement card/layout and invitation polish using Shadcn primitives; leave invite functions untouched.
- [x] Run focused and full tests, lint, typecheck, PostCSS compilation; production build verification through Vercel Preview (local sandbox port blocked).
- [x] Commit through connected GitHub connector, leave PR Draft for owner review.
