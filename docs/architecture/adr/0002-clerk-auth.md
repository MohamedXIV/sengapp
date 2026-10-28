# ADR 0002 — Clerk authentication, open signup and private Convex graph

**Status:** Accepted by product owner, 27 October 2026 (amends invitation-only foundation).

## Decision

Clerk manages authentication, verified emails and sessions. Convex owns one ordinary private `profiles` row per verified Clerk subject, server-side role authorization, one-use connection invitations, symmetric connections, blocks and audit records.

`ConvexProviderWithClerk` consumes the signed Clerk session token with audience `convex`, email and boolean `email_verified`. Convex exposes the claim as `identity.emailVerified`. Without explicit `true`, a subject, and usable signed email, server functions fail closed.

On first verified access, `profiles.ensureMine` idempotently provisions an active `member`; no invitation is necessary. This grants zero relationships and no other user's data. `bootstrapOperator` is separate and requires a verified email present in the private Convex operator allowlist, refusing suspension; it can explicitly promote an existing ordinary member.

Ordinary active members can issue hashed, expiring connection links. Recipients may create their own account independently, then knowingly accept or decline. Only a successful atomic acceptance creates a canonical symmetric connection; no public search, invitation-triggered member creation or implicit friend access exists.

## Consequences

- Development and Preview require correct Clerk JWT claims and issuer/audience configuration; missing verification is a hard error, never inferred from a populated email.
- All cross-user messaging, files and companion context must later enforce their own authorization; a connection alone is not a blanket grant.
- Live two-account Preview smoke and security checks are required before Production.
- Resend and encrypted AI BYOK plus quota enforcement are deferred to their own phases.
