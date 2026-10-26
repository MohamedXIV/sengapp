# Phase 0 Acceptance Ledger — Clerk + Convex

This checklist is a verification gate, not a claim that Sengapp is production ready.

## Automated

- [ ] Typecheck passes locally and on GitHub Actions with Clerk dependencies.
- [ ] ESLint passes locally and on GitHub Actions.
- [ ] Domain and security suite passes locally and on GitHub Actions (**23 tests**), including Convex-test identity claims and absent/false `email_verified`.
- [ ] Desktop + mobile unauthenticated Playwright checks pass in CI.
- [ ] Next.js production build passes without real credentials; sign-in falls back to setup instructions while unconfigured.

## Live two-account smoke — owner-controlled Sengapp Clerk/Convex credentials

- [ ] Verified allowlisted Clerk account creates exactly one operator profile.
- [ ] Unverified email and missing `email_verified` cannot bootstrap or redeem.
- [ ] Operator creates a 32-byte invitation; raw token is absent from Convex documents.
- [ ] Second verified Clerk account redeems invite and reaches `/home`.
- [ ] Uninvited Clerk account cannot access member settings or operator actions.
- [ ] Wrong recipient email, forged, expired and revoked codes are rejected.
- [ ] Replaying a redeemed code fails.
- [ ] Simultaneous redemptions consume a code at most once.
- [ ] Sign-out / revoked Clerk session removes Convex protected access.
- [ ] Member cannot issue, revoke or list operator invitations.
- [ ] Mobile viewport, keyboard, motion and light/dark behavior manually checked.

No live Clerk, production deployment, or real two-account smoke is claimed by automated tests.
