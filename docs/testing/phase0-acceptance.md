# Phase 0 Acceptance Ledger

This checklist is a verification gate, not a claim that Sengapp is production ready.

## Automated

- [x] Typecheck passes locally.
- [x] ESLint passes locally.
- [x] Domain and security unit tests pass locally, including Convex-test integration with a simulated verified identity.
- [ ] Desktop and Android-size unauthenticated Playwright smokes pass. **Blocked:** Chrome headless binary absent; browser download returned a truncated/non-ZIP artifact from the CDN. App dev server was verified to start when local listen permissions were granted.
- [x] Production Next.js build passes without real credentials; auth API fails closed while unconfigured.

## Live two-account smoke — requires owner-controlled Convex/Google credentials

- [ ] Verified allowlisted Google account creates exactly one operator profile.
- [ ] A claimed operator email with an unverified identity cannot bootstrap.
- [ ] Operator creates one 32-byte invitation; raw token is absent from Convex records.
- [ ] Different verified Google account redeems invite and reaches `/home`.
- [ ] Outsider with only an OAuth session cannot access member settings or operator calls.
- [ ] Forged and expired codes are rejected without profile creation.
- [ ] Replaying a redeemed code fails.
- [ ] Two simultaneous redemptions: no more than one succeeds.
- [ ] Logout removes access to protected reads/writes; revoked sessions cannot mutate.
- [ ] Operator-only invitation list/issuance is forbidden to regular members.
- [ ] Mobile viewport, keyboard navigation, reduced motion, and light/dark themes are manually checked.

No live OAuth, deployment, or two-account smoke was performed while assembling this foundation.
