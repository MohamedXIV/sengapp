# Sengapp P1.2 — Private Group Chat Acceptance

This is implementation and verification evidence for a stacked **Preview-only** change. It is not approval to deploy to Production or merge Phase 0/P1.1 with their human security gates still open.

## Product and permission contract

- Group creation is private; the creator is its owner and can name or rename it.
- Group administrators invite **their own accepted connections only**. Recipients join explicitly; an invitation itself grants no message access. No public group directory, unsolicited DM, or implicit invitation of group acquaintances.
- Owner can promote/demote admins and remove non-owners. Admins may invite or remove ordinary members, but not other admins or the owner. Non-owner members may leave; ownership transfer/deletion are deferred.
- Every group read, send, member-list, and membership mutation checks the current verified, active Clerk-backed profile and current server-side membership. Suspensions, unauthorized IDs, and removed memberships fail closed.
- Group history is filtered **on the server** to messages strictly after the current membership's `joinedAt`. A member removed and reinvited gets a new join boundary, not their previous access range. Direct-message history and accepted-connection rules remain unchanged.
- Group names are 1–60 characters. Groups have a 32-member cap, creators are limited to 10 groups/day, and invite senders to 50 invitations/day. Existing text constraints and idempotent client nonces apply to groups.

## Automated local evidence — 29 October 2026

- `npm test`: **93/93 Vitest tests across 27 files** and **1/1 Node stack-contract test**, including six focused group backend scenarios and three group UI component tests.
- `npm run typecheck`: all three TypeScript configurations passed.
- `npm run lint`: passed with zero warnings.
- `npm run build -- --webpack`: compiled, type-checked, and generated all 12 pages successfully in a permitted execution environment. The more restricted runner blocked the TypeScript CLI subprocess; do not misreport that first failure as a code error.
- Existing DM tests still pass, including delivery, pagination, block/suspension restrictions, and retry idempotency.

## Remaining before group merge

- An exact-head Vercel Preview / Convex Preview deployment and its build verification.
- Authenticated owner + invitee browser smoke: create, invite, accept, realtime exchange, refresh, leave/remove, deny post-removal access, rejoin without pre-join history.
- Arabic/English, desktop/mobile, keyboard and screen-reader spot checks on the group UI.
- Close the separately recorded P0/P1.1 human negative-path acceptance gates; do not retarget or merge this stacked branch ahead of them.

No Production environment, data, secrets, or deployment settings are modified by this branch.
