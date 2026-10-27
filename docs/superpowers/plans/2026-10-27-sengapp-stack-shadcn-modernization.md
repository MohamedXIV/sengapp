# Stack and shadcn/ui Modernization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the active web stack and replace ad-hoc UI controls with working shadcn/ui components before messaging.

**Architecture:** Migrate Next.js 15/Tailwind 3 to stable compatible Next.js 16/Tailwind 4 with current React and Clerk/Convex. Keep CSS semantic-token based; initialize current shadcn registry components and incrementally refactor the existing Phase 0 routes.

**Tech Stack:** Next.js 16.4, React 19.3, Tailwind 4.3, shadcn/ui, Clerk, Convex, Zod, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-27-sengapp-ui-foundation-personal-themes-design.md`

## Global Constraints

- Stay on canonical draft PR #10; Production and `main` untouched.
- Use the connected GitHub connector for every repository read/write.
- No incompatible forced peer resolution, canary package or blind `npm audit fix --force`.
- Preserve verified signup, one-shot connections, RTL, accessibility and system appearance.
- Prefer local/Preview checks; avoid unnecessary per-file GitHub Actions runs.

## Review Focus

- No secrets or Clerk keys: public build remains available, but authenticated Convex guards do not weaken (Task 1).
- Stale Next.js middleware filename: Clerk protection and unauthenticated routes survive `proxy.ts` transition (Task 1).
- Dark appearance / Arabic RTL: semantic tokens and focus rings retain contrast/direction (Task 2).
- Disabled form controls: async submit/revoke/accept remain keyboard-operable with good feedback (Task 3).
- Mobile narrow viewports: sidebar/sheet cannot block form completion or sign-out (Task 3).

---

### Task 1: Framework and dependency upgrade

**Files:**
- Modify: `package.json`, `package-lock.json`, `next.config.ts`, `postcss.config.mjs`, `src/middleware.ts` → `src/proxy.ts`, CI/test configuration if required.
- Test: `tests/e2e/access.spec.ts` plus existing domain/component suites.

**Interfaces:**
- Produces the existing app entry points and unchanged Convex contract on current stable framework APIs.

- [ ] **Step 1:** Add a regression for authenticated/anonymous access routes and verify baseline assertions on existing suite.
- [ ] **Step 2:** Upgrade only stable supported packages, preserve lockfile integrity; require peer dependency resolution without overrides.
- [ ] **Step 3:** Migrate Next 16 `proxy.ts`, Turbopack config and Tailwind 4 PostCSS/CSS entrypoints per official docs.
- [ ] **Step 4:** Run `npm ci`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` and targeted Playwright.
- [ ] **Step 5:** Commit a coherent framework upgrade and report exact versions/compatibility holds.

### Task 2: Real shadcn/ui and tokens

**Files:**
- Modify: `components.json`, `src/app/globals.css`, `src/lib/utils.ts` as needed.
- Create: only required `src/components/ui/{button,input,textarea,card,label,select,switch,badge,alert,separator,sheet,sidebar,dialog}.tsx` via official shadcn CLI; include generated peer dependencies.
- Test: `tests/components/shadcn-baseline.test.tsx`.

**Interfaces:**
- Produces importable shadcn primitives under `@/components/ui/*`.

- [ ] **Step 1:** Add component tests for button disabled state, accessible labels, theme tokens and modal keyboard behavior; verify initial failures.
- [ ] **Step 2:** Run current shadcn generator against migrated Tailwind 4 project and inspect source/versions; do not hand-invent a parallel library.
- [ ] **Step 3:** Install only actually used components; align semantic tokens to CSS variables for both appearances.
- [ ] **Step 4:** Run component tests, typecheck, lint and build; commit.

### Task 3: Phase 0 shell and form adoption

**Files:**
- Modify: `src/components/layout/app-shell.tsx`, `src/features/profile/profile-settings-form.tsx`, `src/features/connections/create-connection-invite.tsx`, `src/features/connections/accept-connection-invite.tsx`, relevant `src/app/*/page.tsx`.
- Test: `tests/components/share-invite.test.tsx`, `tests/e2e/access.spec.ts`, add accessible-form/shell tests.

**Interfaces:**
- Consumes shadcn components from Task 2; preserves all feature callbacks, Convex identities and invitation IDs.

- [ ] **Step 1:** Add failing tests for form labels, save-disabled/loading, invite link disappearance, keyboard-operable navigation and mobile sheet.
- [ ] **Step 2:** Replace raw inputs/buttons/cards/switches in touched screens with shadcn components; keep behavior intact and native semantics.
- [ ] **Step 3:** Confirm theme, RTL, reduced motion, mobile layout; run full test/typecheck/build and targeted browser cases.
- [ ] **Step 4:** Commit the UI adoption batch; update PR acceptance ledger with tested vs pending checks.
