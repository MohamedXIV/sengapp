# Sengapp Phase 0 — App Foundation & Invite-Only Access Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a working, mobile-friendly Sengapp app shell with Convex-backed authenticated, invite-only access, a protected member profile, and a minimal operator invitation workflow.

**Architecture:** Next.js App Router renders the accessible PWA shell, while Convex owns persistent profiles, invitations and all authorization decisions. Better Auth integrates with Convex for sessions; Google OAuth is the initial **implementation recommendation** to avoid password-reset infrastructure, not a previously user-approved product rule. Other sign-in methods may be added without opening access to uninvited users. A valid login does not equal app membership: only an approved operator or redeemed invite creates an authorized profile.

**Tech Stack:** Next.js, React, TypeScript, Tailwind, shadcn/ui, Convex, Better Auth with `@convex-dev/better-auth`, Zod, Vitest, `convex-test`, Playwright, Node 24.x and npm.

**Spec:** [`docs/specs/sengapp-v0.1-design.md`](../../specs/sengapp-v0.1-design.md) — the approved product spec. This plan implements *only* its identity/invitations, shared architecture and security foundation. Messaging, media, AI companions and richer social features each get later plans.

## Global Constraints

- Invite-only, private groups/DMs; no public feed, stranger discovery or public communities.
- Modern by default, playful by choice. Mobile-first, accessible, dark/light-capable UI.
- Online/last-seen/read/typing default-on and independently configurable **when the messaging phase implements them**.
- No end-to-end encryption in v0.1; do not claim it or imply AI conversations are private from the backend.
- Convex is the single application database. No Supabase/SpacetimeDB integration in this phase.
- Every sensitive Convex function checks the caller's identity and server-side role/membership; a login token alone does not grant app access.
- Invites are bounded, expiring, one-time tokens; do not store raw tokens. Operator registration uses verified identity, not an arbitrary client claim.
- No real user data or provider tokens in tests or commits. Don't provision paid infrastructure or silently deploy the site.
- No GitHub Actions workflow by default; use local tests and manual smoke checks.
- Don't turn this plan into a monolith. Co-locate files by feature and keep focused contracts.

## Proposed File Structure

| Area | Files and responsibilities |
| --- | --- |
| App shell | `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/manifest.ts`, `src/app/globals.css`, `src/components/providers.tsx` — metadata, base theme, PWA manifest and providers |
| Auth | `convex/convex.config.ts`, `convex/auth.config.ts`, `convex/auth.ts`, `convex/http.ts`, `src/lib/auth-client.ts`, `src/lib/auth-server.ts`, `src/app/api/auth/[...all]/route.ts` — official Better Auth integration |
| Identity | `convex/schema.ts`, `convex/lib/authz.ts`, `convex/profiles.ts` — profile role and restricted identity lookups |
| Invitations | `convex/invites.ts`, `src/lib/invite-codes.ts`, `src/features/invites/invite-form.tsx`, `src/app/invite/page.tsx` — invitation issuance, redemption, UI |
| Protected space | `src/app/(app)/layout.tsx`, `src/app/(app)/home/page.tsx`, `src/features/profile/profile-card.tsx` — signed-in member shell |
| Verification | `tests/invites.test.ts`, `tests/authz.test.ts`, `tests/invite-codes.test.ts`, `e2e/access.spec.ts` — negative security tests and user journeys |
| Configuration | `package.json`, `tsconfig.json`, `vitest.config.ts`, `playwright.config.ts`, `.env.example`, `docs/development.md` — install/test commands and non-secret examples |

The exact library API is checked against installed versions during Task 2. Keep externally maintained auth-specific structures inside Better Auth's component; application profiles are separate.

## Review Focus

1. **Forged or expired invite:** redemption must fail without creating a member profile — test in Task 4.
2. **Logged in but not invited:** queries for a member page/profile must be denied — test in Task 3 and E2E in Task 6.
3. **Two people redeem one code concurrently:** no more than one may succeed — test in Task 4 and integration smoke in Task 6.
4. **Claimed operator email without verified Google identity:** operator role must be refused — test in Task 3.
5. **Logging out or losing a session:** protected content must disappear and mutations fail — test in Task 6.

---

### Task 1: Bootstrapped Next.js PWA Shell

**Files:**
- Create: `package.json`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `src/app/manifest.ts`, `src/components/providers.tsx`, `tsconfig.json`, `vitest.config.ts`, `playwright.config.ts`, `.env.example`, `docs/development.md`
- Test: `e2e/access.spec.ts` (initial shell smoke)

**Interfaces:**
- Produces: `Providers({children}: {children: React.ReactNode})`; `manifest(): MetadataRoute.Manifest`; scripts `dev`, `typecheck`, `lint`, `test`, `test:e2e`, `build`.

- [ ] **Step 1: Write the failing shell test.** In `e2e/access.spec.ts`, `test('landing page introduces Sengapp without offering public chat', ...)`: navigate to `/`; assert heading `Sengapp` and text `Invite only`; assert no public conversation list.
- [ ] **Step 2: Run E2E and confirm failure.** `npm run test:e2e -- e2e/access.spec.ts`; expect missing app/server test failure.
- [ ] **Step 3: Scaffold minimal Next.js 24.x-compatible TypeScript App Router app with shadcn/ui tokens and Tailwind.** Implement the manifest with name `Sengapp`, `display: 'standalone'`, `start_url: '/'`, and accessible nonanimated default shell. Avoid a push service worker in this phase.
- [ ] **Step 4: Document installation and environment variable names (values left blank) in `docs/development.md` and `.env.example`.**
- [ ] **Step 5: Run `npm run typecheck`, `npm run lint`, `npm run test:e2e -- e2e/access.spec.ts`, `npm run build`; all exit 0.**
- [ ] **Step 6: Commit `feat: bootstrap Sengapp PWA shell`.**

### Task 2: Convex + Better Auth Integration

**Files:**
- Create: `convex/convex.config.ts`, `convex/auth.config.ts`, `convex/auth.ts`, `convex/http.ts`, `src/lib/auth-client.ts`, `src/lib/auth-server.ts`, `src/app/api/auth/[...all]/route.ts`
- Modify: `src/components/providers.tsx`, `src/app/page.tsx`, `.env.example`, `docs/development.md`
- Test: `e2e/access.spec.ts`

**Interfaces:**
- Produces: `authClient` (Better Auth client), `createAuth(ctx)`, `authComponent`, Next handler `GET/POST`, and `api.auth.getCurrentUser({})`. Later tasks use the server identity through `authComponent.getAuthUser(ctx)`.

- [ ] **Step 1: Write a failing unauthenticated view test.** `test('unauthenticated visitor sees sign-in, not member workspace', ...)`: `/` shows a sign-in action; `/home` redirects to the sign-in/invite gate.
- [ ] **Step 2: Run the focused E2E test; verify it fails.**
- [ ] **Step 3: Install Convex, compatible Better Auth and integration versions, matching their current official Next.js guide.** Configure Convex component/auth/http, provider wrapper, Next route handler and Google OAuth sign-in. Require a verified email in the provider config; do not enable automatic app profile creation for every OAuth session.
- [ ] **Step 4: Define `api.auth.getCurrentUser({})` to return the verified auth user or `null` without disclosing any protected application profile.**
- [ ] **Step 5: Document required server-only `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, Convex deployment/site URLs and local callback paths. Never commit live values.**
- [ ] **Step 6: Run `npm run typecheck`, `npm run test:e2e -- e2e/access.spec.ts`, and `npm run build`; all exit 0. Validate a real OAuth round trip in a disposable development deployment when credentials are configured.**
- [ ] **Step 7: Commit `feat: connect Convex and authenticated sessions`.**

### Task 3: Profiles and Server-Only Membership Guard

**Files:**
- Create: `convex/schema.ts`, `convex/lib/authz.ts`, `convex/profiles.ts`, `tests/authz.test.ts`
- Modify: `.env.example`, `docs/development.md`

**Interfaces:**
- Produces: `requireAuthorizedProfile(ctx: QueryCtx | MutationCtx): Promise<Doc<'profiles'>>`; `requireOperator(ctx: QueryCtx | MutationCtx): Promise<Doc<'profiles'>>`; `api.profiles.getMine({}): Profile | null`; `api.profiles.bootstrapOperator({}): Id<'profiles'>`.
- Profile fields: `authUserId: string` (indexed unique by policy), `email: string`, `displayName: string`, `role: 'operator' | 'member'`, `joinedAt: number`.

- [ ] **Step 1: Write failing `tests/authz.test.ts`:** a visitor without auth or redeemed profile cannot use `requireAuthorizedProfile`; an authenticated outsider cannot get another profile by ID; unverified owner-email claimant cannot bootstrap operator.
- [ ] **Step 2: Run `npm run test -- tests/authz.test.ts` and confirm failures.**
- [ ] **Step 3: Implement the `profiles` schema, guarded read, and bootstrap operator path.** `SENGAPP_OPERATOR_EMAILS` is a server-only allowlist of *verified* provider identities; idempotently create exactly one operator profile per auth subject. The app never trusts a client-supplied role/email.
- [ ] **Step 4: Run focused unit tests and `npm run typecheck`; pass.**
- [ ] **Step 5: Commit `feat: enforce member and operator authorization`.**

### Task 4: Single-Use Invitations and Redemption

**Files:**
- Create: `src/lib/invite-codes.ts`, `convex/invites.ts`, `tests/invite-codes.test.ts`, `tests/invites.test.ts`
- Modify: `convex/schema.ts`

**Interfaces:**
- Produces: `generateInviteCode(): string` (32 cryptographically random bytes encoded URL-safe); `hashInviteCode(code: string): Promise<string>` (SHA-256 hex); `api.invites.issue({ttlHours: number}): {code: string; expiresAt: number}`; `api.invites.redeem({code: string}): {profileId: Id<'profiles'>}`.
- Invite fields: `codeHash` unique index, `createdBy`, `createdAt`, `expiresAt`, `redeemedAt?`, `redeemedBy?`.

- [ ] **Step 1: Write `tests/invite-codes.test.ts` asserting 32-byte entropy (43-character base64url length), stable SHA-256 hashing and no plaintext code stored by persistence code.**
- [ ] **Step 2: Write `tests/invites.test.ts` asserting nonoperator issue denied, expiry rejected, wrong code denied, first redeem creates profile, second redeem denied, and two concurrent redemptions cannot both commit.**
- [ ] **Step 3: Run both focused tests to see expected failure.**
- [ ] **Step 4: Implement guarded issue/redeem mutations.** `issue` requires operator, enforces bounded TTL and a modest outstanding-invite limit; `redeem` requires an authenticated verified identity, hashes the provided code and atomically records redemption and profile creation. Generic user-facing errors avoid revealing whether a given email is a member.
- [ ] **Step 5: Run focused tests and `npm run typecheck`; pass. Confirm concurrency behavior once against a real dev Convex deployment because mocks do not perfectly model optimistic concurrency.**
- [ ] **Step 6: Commit `feat: add one-use membership invitations`.**

### Task 5: Accessible Member and Operator Journey

**Files:**
- Create: `src/app/(app)/layout.tsx`, `src/app/(app)/home/page.tsx`, `src/app/invite/page.tsx`, `src/features/invites/invite-form.tsx`, `src/features/profile/profile-card.tsx`
- Modify: `src/app/page.tsx`, `e2e/access.spec.ts`

**Interfaces:**
- Consumes: `api.profiles.getMine`, `api.invites.issue`, `api.invites.redeem`; produces a protected `/home` and human-usable invite redemption/issuance flows.

- [ ] **Step 1: Write E2E tests:** signed-in nonmember sees invitation gate; redeemed member sees `/home`; nonoperator cannot see invite generator; invalid/expired code shows a recoverable error.
- [ ] **Step 2: Run the E2E tests and verify failures.**
- [ ] **Step 3: Implement mobile-first shadcn controls, keyboard focus/error states and operator-only invitation controls.** Use invite links with the token in a URL fragment (`/invite#code=...`), read it client-side and remove it from the address bar after pickup; never put the token in a server-visible path/query parameter. Don't display secrets again after invite creation; provide an explicit copy affordance while the token is in state.
- [ ] **Step 4: Run E2E tests with deterministic test identities and fake provider where feasible; run typecheck, lint and build.**
- [ ] **Step 5: Commit `feat: complete invite-only onboarding journey`.**

### Task 6: Security and Release Readiness Gate

**Files:**
- Modify: `tests/authz.test.ts`, `tests/invites.test.ts`, `e2e/access.spec.ts`, `docs/development.md`
- Create: `docs/testing/phase0-acceptance.md`

**Interfaces:**
- Produces: an explicit checklist and automated checks for the first two-account journey, not a production deployment.

- [ ] **Step 1: Add negative tests** for post-logout reads/writes, repeated code replay, wrong identity, bad TTL, role forgery and stale-session access. Assert `FORBIDDEN` or expected denial, not brittle framework error prose.
- [ ] **Step 2: Run focused suites before changes; verify any newly discovered failures.**
- [ ] **Step 3: Fix only verified deficiencies in access rules or UI.**
- [ ] **Step 4: Execute `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:e2e`, `npm run build`; all exit 0. Do not trigger GitHub Actions just to obtain a badge.**
- [ ] **Step 5: Manual two-account smoke on Android-sized viewport:** operator issues invite, member redeems, workspace opens; stranger rejected; sign-out revokes access; reload preserves valid state. Record pass/fail and any provider credentials not configured in `docs/testing/phase0-acceptance.md`.
- [ ] **Step 6: Commit `test: harden membership foundation and document acceptance`.**

## Next Plans, Not Part of This Plan

- **Phase 1 — Messaging core:** conversation/member schema, DMs/groups, text, pagination, replies/reactions/edit/delete, read positions, presence, controls and chat search. Implement approved no-history-before-join policy.
- **Phase 2 — Media/PWA:** protected attachments, voice notes, media previews, push permissions, install and modest-phone tests.
- **Phase 3 — Companions and personality:** optional Pixi layer, profile fonts/colors/status, private AI space, explicit group consent and mention-only AI, privacy/cost guards.
- **Phase 4 — Private alpha:** multi-account leakage tests, stability and recovery, privacy notice, quotas and trusted-user trials.

Each phase receives its own design-specific executable plan once its dependencies are ready.

## Self-Review

- **Spec coverage:** this plan intentionally covers first-time access, identity, roles, invitations, bootstrap, app shell and cross-user security. Other approved requirements are assigned to later phase plans above.
- **Contract consistency:** `requireAuthorizedProfile` gates app reads and writes; `requireOperator` gates `issue`; `redeem` creates an authorized profile; UI calls these named Convex functions.
- **Failure coverage:** forged/expired/replayed invite, uninvited auth, concurrent redemption, unverified operator and logout are mapped to explicit tests.
- **Operational prerequisite:** live Google OAuth and Convex dev deployment need owner-controlled configuration. Do not claim real OAuth or deployment smoke has passed without credentials.
- **Next decision:** owner must review this plan before any app scaffolding, and can choose a different initial sign-in method if family members cannot use Google.
