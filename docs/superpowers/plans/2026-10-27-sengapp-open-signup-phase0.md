# Sengapp Open Signup and Private Connections — Phase 0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every verified Clerk signup receives a private Sengapp profile without an invitation, while optional one-use links create connections only after an explicit, authorized acceptance.

**Architecture:** Clerk authenticates and supplies signed verified-email claims; Convex transactionally provisions a single regular profile, manages operator elevation separately and stores hashed one-use **connection** invitations and symmetric connections. Next.js exposes sign-in, a no-contacts private home, a create/copy/native-share flow and an authenticated acceptance flow; no email vendor or AI model is introduced in Phase 0.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Clerk 7, Convex 1.47, Zod, Tailwind/shadcn patterns, Vitest/convex-test, Playwright, Node 24.x.

**Spec:** `docs/superpowers/specs/2026-10-27-sengapp-open-signup-design.md` (amends `docs/specs/sengapp-v0.1-design.md`).

## Global Constraints

- Work only on existing canonical draft PR #10 branch `feat/phase0-invite-foundation`. Never merge or touch Production without separate review; verify live HEAD before changes.
- Use the connected GitHub connector for **all repository reads/writes**. Test against the exact changed head via available local test environment and/or existing CI; do not substitute GitHub CLI/raw API.
- Open registration creates a **member** only. Operator elevation requires a separate explicit mutation and server-side verified-email allowlist. Missing/false `email_verified` must fail closed.
- Registration, connecting and accepting are distinct; no open user directory, implicit relationships or access to messages, attachments or companions.
- Invitation codes are 32 random bytes, Base64URL 43 chars, hashed using SHA-256; keep the URL secret in `/invite#code=...`, remove fragment promptly and don't log raw values.
- Expiring, revocable, one-use connection invitations; explicit Accept/Decline after verified sign-in; optional recipient-email binding; no self-acceptance.
- Copy Link is always available. Native Web Share is opportunistic on HTTPS and an actual click, with safe failure/cancel behavior; WhatsApp availability is device-specific.
- Resend/automatic outbound email, public search, model inference, key storage, quotas and BYOK **are not implemented in this plan**. Put AI budget/BYOK in the separate companion-phase plan.
- Follow focused-file boundaries; preserve Shadcn-first direction, accessibility, keyboard use, mobile layout, both themes and reduced-motion behavior.

## File and interface map

- `convex/lib/permissions.ts` → verified Clerk identity, member/operator guards; `convex/auth.config.ts` / `src/components/providers.tsx` → Clerk–Convex token plumbing.
- `convex/profiles.ts` → `ensureMine` idempotent member creation, `getMine`, explicit `bootstrapOperator` promotion and profile editing.
- `convex/schema.ts` → remove signup-invite coupling; add `connectionInvites`, canonical `connections`, minimal `blocks` (`blockerProfileId`, `blockedProfileId`, `createdAt`, `by_pair` index) for deny rule. `convex/lib/crypto.ts` reused unchanged.
- `convex/lib/connectionPolicy.ts` (new) → pure code/expiry/email/self/limit rules. `convex/connectionInvites.ts` (new) → `issue`, internal `insertIssuedCode`, `preview`, `accept`, `decline`, `revoke`, `listMine`, all server-authorized.
- `src/components/access/member-gate.tsx` → create-and-retry private member gate, explicit auth error status. `src/app/admin/invitations/page.tsx` → no longer member-invite manager; operator-only activation or administrative placeholder.
- `src/app/invite/page.tsx` and `src/features/connections/*` (new) → accept invitation after sign-in, send/copy/share and contact list UI. `src/components/layout/app-shell.tsx`, `src/app/home/page.tsx`, `src/app/login/page.tsx`, `src/app/page.tsx` → updated copy/routes.
- `src/lib/validations/invitation.ts` → replace signup-input validators with connection-invite Zod schemas.
- `tests/integration/access.test.ts`, `tests/domain/{permissions,invitations,invite-policy,validation}.test.ts`, `tests/e2e/access.spec.ts` → update old assertions; add focused `tests/integration/connections.test.ts`, `tests/domain/connection-policy.test.ts`, `tests/components/share-invite.test.tsx` where appropriate.
- `README.md`, `docs/development.md`, `docs/testing/phase0-acceptance.md`, `docs/architecture/adr/0002-clerk-auth.md`, `.env.example` → new product truth; document legacy removal, Clerk Session Token claims and test evidence.

## Review Focus

1. **Two concurrent onboarding calls:** one `profiles` row with the same ID, never duplicate identities — tested Task 2.
2. **Operator allowlist address with existing regular profile:** no automatic elevation; explicitly approved bootstrap promotes only verified allowlisted active user, never a suspended one — Task 2.
3. **Link handed to wrong account / self / preexisting connection:** no connection, no token consumption on rejected cases — Task 3.
4. **Simultaneous link acceptance or replay:** at most one relationship and one successful consumption — Task 3.
5. **Native share unavailable/canceled/clipboard denied:** visible working link and honest status, no claim of delivery or accidental duplicate tokens — Task 4.

---

### Task 1: Re-establish verified Clerk → Convex identity on Preview

**Files:**
- Inspect/modify only as proven: `convex/auth.config.ts`, `src/components/providers.tsx`, `convex/lib/permissions.ts`
- Test: `tests/integration/access.test.ts`
- Docs: `docs/development.md`, `docs/testing/phase0-acceptance.md`

**Interfaces:**
- Consumes: `ctx.auth.getUserIdentity()`; Clerk Session Token with `aud: "convex"`, `email`, boolean `email_verified`; `CLERK_JWT_ISSUER_DOMAIN`.
- Produces: existing `getVerifiedAuthUser(ctx): Promise<{userId:string;email:string;name?:string}>` works in exact Preview, or returns explicit `VERIFIED_SIGN_IN_REQUIRED` without issuing access.

- [ ] **Step 1: Reproduce and record the failing exact Preview path.** Sign in with the owner Clerk Development account, use the current Preview `profiles.bootstrapOperator` once, and capture the failure code/Convex log time; do not infer user unauthorized from all errors.
- [ ] **Step 2: Verify claims and provider path.** Confirm saved Clerk `__session` template produces a boolean verification claim, native `ConvexProviderWithClerk` gets that token and Convex issuer/audience match. Instrument only temporary **non-PII flags** if needed (`identityPresent`, `emailClaimType`, `verifiedClaimType`), then remove before commit.
- [ ] **Step 3: Write failing regression.** Add case to `tests/integration/access.test.ts`: verified session succeeds; absent/null/false/string `email_verified` fails; an authenticated session without a usable Convex identity fails with stable code, never false operator-denial copy.
- [ ] **Step 4: Make minimal proven configuration/provider change.** Preserve verified-email fail-closed behavior; do not switch off claim check, loosen auth config or trust client metadata. Separate authentication failure copy from allowlist `FORBIDDEN`.
- [ ] **Step 5: Verify and commit.** `npm test -- tests/integration/access.test.ts`; run typecheck/lint; repeat exact Preview sign-in; record successful `getVerifiedAuthUser` validation *before* proceeding. Commit verified source and setup-doc changes via GitHub connector.

### Task 2: Idempotent open-signup profiles and explicit operator activation

**Files:**
- Modify: `convex/profiles.ts`, `convex/lib/permissions.ts`, `convex/schema.ts`
- Modify: `src/components/access/member-gate.tsx`, `src/app/home/page.tsx`, `src/app/admin/invitations/page.tsx`
- Test: `tests/integration/access.test.ts`, `tests/domain/permissions.test.ts`

**Interfaces:**
- Produces: `api.profiles.ensureMine({}) : Id<"profiles">` transactional idempotent mutation; `api.profiles.getMine({})` query; `api.profiles.bootstrapOperator({})` explicitly elevates only an active allowlisted member or creates a vetted operator in an exceptional race.
- Downstream: every member can invoke `requireAuthorizedProfile(ctx)`, but only an operator `requireOperator(ctx)`.

- [ ] **Step 1: Write failing Convex integration tests.** Two unrelated verified users call `ensureMine({})` without invitations and each obtains an active `member` profile; simultaneous calls for one subject return the same ID; missing/false identity, suspended user and operator-only mutations remain denied.
- [ ] **Step 2: Write operator-upgrade regression.** Verified allowlisted regular member stays `member` until explicit `bootstrapOperator({})`, which elevates exactly once; unverified, non-allowlisted and suspended members cannot elevate.
- [ ] **Step 3: Implement `ensureMine` and promotion.** Reuse default preferences and verified claims, index `by_auth_user_id`, choose a safe temporary display name without forcing a unique handle in onboarding. Make `requireAuthorizedProfile` return appropriate `PROFILE_REQUIRED` instead of old `INVITATION_REQUIRED` for missing profiles.
- [ ] **Step 4: Change gate UI.** Only after `useConvexAuth().isAuthenticated`, `ResolvedMembership` invokes `ensureMine` once, retries on recoverable failure, and renders actual auth/setup errors. Keep `MemberGate operatorOnly` strict; expose explicit bootstrap action from an operator-access page for an allowlisted owner and never grant role from client flags.
- [ ] **Step 5: Verify and commit.** `npm test -- tests/integration/access.test.ts tests/domain/permissions.test.ts`, `npm run typecheck`, `npm run lint`. Confirm a brand-new Clerk user reaches `/home` without an invite; commit via connector.

### Task 3: Move invitations from membership to accepted connections

**Files:**
- Create: `convex/lib/connectionPolicy.ts`, `convex/connectionInvites.ts`
- Modify: `convex/schema.ts`, `src/lib/validations/invitation.ts`
- Retire or redirect: `convex/invites.ts`, `convex/lib/invitationDomain.ts`, `convex/lib/invitePolicy.ts`
- Test: `tests/domain/connection-policy.test.ts`, `tests/integration/connections.test.ts`

**Interfaces:**
- `api.connectionInvites.issue({ ttlHours: 24|72|168, recipientEmail?: string, note?: string }) : Promise<{ code:string;expiresAt:number }>` (action; secure token generation outside mutation).
- `api.connectionInvites.preview({code:string}) : {valid:boolean; senderDisplayName?:string; note?:string;expiresAt?:number;reason?:string}` (query; verified actor only, no unwanted sender/email leaks).
- `api.connectionInvites.accept({code:string}) : {connectionId:Id<"connections">}`; `decline({code})`; `revoke({invitationId})`; `listMine({})` (server-owned authenticated functions).
- Schema: `connectionInvites` hash/hint/issuer/optional recipient binding/state/audit timestamps, `connections` canonical ordered pair and creator/time indices, mandatory denial when either member has a `blocks` row targeting the other; no `redeemedInvitationId` required on profiles.

- [ ] **Step 1: Write pure domain tests.** Accept only 43-character token, pending unexpired state, matching optional verified email and distinct sender/receiver, no existing relationship/block, issuer limit; otherwise return reason without consuming.
- [ ] **Step 2: Write integration tests.** Member A issues link without operator rights; member B signs up independently and sees preview; B explicitly accepts; A/B now share exactly one canonical connection. Neither a third account nor sender can accept recipient-bound/self links. No effect on unrelated profiles/data.
- [ ] **Step 3: Test races and revocation.** Concurrent B/C accept for same unbound code produces exactly one success, one connection and consumed token; replay/expired/revoked/declined links fail; the sender cannot revoke another user's code. Insert a `blocks` row as a test fixture for either direction; acceptance is denied and code remains pending.
- [ ] **Step 4: Implement transactional domain.** Reuse `generateSecureInvitationToken`, `hashInvitationToken`; make issuance a Convex action and insertion an internal mutation that rechecks issuer by authenticated user ID. Cap pending links at 10 per member and at most 20 created in the previous 24 hours; issue TTL options 24/72/168 hours; ensure logs/audit contain IDs/hints only.
- [ ] **Step 5: Remove signup-invite assumptions and verify.** Retire `invites.redeem` account-creation path and old operator-only invite ledger, with no active data migration requirement for isolated Preview; `npm test -- tests/domain/connection-policy.test.ts tests/integration/connections.test.ts`; regenerate Convex API types for Preview; commit.

### Task 4: Accessible member invite, copy and native share UX

**Files:**
- Create: `src/features/connections/create-connection-invite.tsx`, `src/features/connections/accept-connection-invite.tsx`, `src/app/connections/page.tsx`
- Modify: `src/app/invite/page.tsx`, `src/app/login/page.tsx`, `src/app/page.tsx`, `src/app/home/page.tsx`, `src/components/layout/app-shell.tsx`
- Replace/retire: `src/features/invitations/admin-invitation-manager.tsx`, `src/features/invitations/invite-redemption-card.tsx`
- Test: `tests/components/share-invite.test.tsx`, `tests/e2e/access.spec.ts`

**Interfaces:**
- Consumes: `api.connectionInvites.issue/preview/accept/decline/revoke/listMine`, `api.profiles.ensureMine/getMine`.
- Produces: `/connections` page for any member; `/invite#code=<base64url>` link; optional direct `navigator.share({title:"Sengapp",text,url})`; `navigator.clipboard.writeText(url)` with select-able visible link if denied.

- [ ] **Step 1: Write component failure tests.** For `navigator.share` undefined/cancel/NotAllowed and clipboard refusal, link remains visible, no fake “sent” state; valid share only from explicit click; copy success announces “Copied”; no repeated token mint on retry.
- [ ] **Step 2: Write redirect/reload tests.** Existing fragment-secret capture into `sessionStorage` survives Clerk sign-in and is removed from URL immediately; acceptance requires explicit click and shows sender identity and decline; no token shows helpful empty state; no auto-accept.
- [ ] **Step 3: Implement new connected UI.** Show `Create invite` to all members, optional email restriction and note, expiration choices, pending invites/revocation, accessible Copy and Share buttons. Wire `/connections` in `AppShell`; only operator-specific account settings remain behind role checks.
- [ ] **Step 4: Update copy.** Landing, login, member home and README UX say open signup, private connections, agent later; do not imply functional AI or WhatsApp delivery before implemented.
- [ ] **Step 5: Verify and commit.** `npm test -- tests/components/share-invite.test.tsx`, `npm run test:e2e`, keyboard/mobile/theme smoke; commit source and revised E2E tests.

### Task 5: Exact-head verification, security and Phase 0 closeout

**Files:**
- Modify: `README.md`, `docs/development.md`, `docs/testing/phase0-acceptance.md`, `docs/architecture/adr/0002-clerk-auth.md`, `.env.example`, applicable `tests/**/*`
- Inspect: `package-lock.json`, CI `.github/workflows/phase0-ci.yml`

**Interfaces:**
- Consumes Tasks 1–4; produces truthful acceptance ledger and PR #10 ready-for-review decision (NOT automatic merge).

- [ ] **Step 1: Replace legacy invite-only documentation and acceptance checks.** Record open verified signup, operator promotion, connection invites/consent, refusal paths and native share fallback; document that AI quotas/BYOK and Resend belong to later distinct implementations.
- [ ] **Step 2: Run exact-head gates.** `npm ci --legacy-peer-deps` (where environment allows), `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `npm run test:e2e`. Do not claim a command passed without its output.
- [ ] **Step 3: Revisit dependency advisories.** Triage 6 previously reported npm advisories, update only compatible safe versions with lockfile and tests; document residual risk, avoid forced major upgrades.
- [ ] **Step 4: Browser smoke using isolated Vercel/Convex Preview.** Two verified accounts independently reach private home, copy/link/share, consent to relationship, inspect role boundaries, log out, retry revoked/signed-out access; verify Convex log. Keep Production untouched.
- [ ] **Step 5: Update PR #10 description and handoff.** Include exact tested head, known limitations, remaining checks and evidence; keep Draft if blockers. Request owner merge approval after verified security/behavior gates.

## Separate future plan: Companion quota + BYOK

The owner-approved companion/budget behavior belongs to a **different implementation plan** when the agent feature starts. Its required inputs are the same ordinary `profiles` identity, per-user shared-key usage budgets, server-only provider adapter, encrypted user-supplied provider credentials, explicit billing choice, revocation, global kill switch, and cross-user isolation tests. No provider keys, Resend, or model invocations are added by Phase 0.

## Self-review and execution boundary

- Spec §Access → Tasks 1–2; §Connections → Tasks 3–4; §Security/Failure → Tasks 1–5; §AI costs → follow-up companion plan, explicitly excluded from Phase 0; §Resend deferral → Tasks 4–5.
- The five Review Focus failure modes each have a named test in Tasks 2–4.
- API names consistently use `profiles.ensureMine` and `connectionInvites.*`.
- Every task has a test/fix/verify/commit cycle, and no Phase 0 step requires paid email or AI services.
- **Owner approved execution in this conversation on 2026-10-27.** All work remains on draft PR #10; live two-account validation and final security review are required before merge.
