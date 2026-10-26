# ADR 0002 — Clerk identity with Convex membership

**Status:** Accepted by product owner, 27 October 2026.

## Decision

Use Clerk for Sengapp sign-in, social/email account management, and sessions.
Use Convex for server-authorized invite redemption, immutable role assignment,
membership, profiles, and operator auditing. The original Better Auth component
has been removed from Phase 0.

The Clerk `convex` JWT template must include the signed `email` and boolean
`email_verified` claims; Convex verifies JWT issuer and audience. All membership
operations derive the user ID from `ctx.auth.getUserIdentity().subject` and fail
closed if verification is absent. An authenticated Clerk session alone grants
no Sengapp membership.

Only the verified owner email in the private Convex `SENGAPP_OPERATOR_EMAILS`
allowlist may bootstrap an operator. All other memberships are granted by a
single-use invitation redeemed atomically in Convex.

## Consequences

- Clerk keys, Convex issuer config and JWT template need owner setup.
- No Google OAuth client or Better Auth secret is required by Sengapp.
- Changing auth providers in the future is isolated from Sengapp membership.
- Live two-account tests are mandatory before enabling an alpha.
