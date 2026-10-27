# Sengapp Phase 0 Acceptance Ledger — Open Signup & Connections

This is an evidence checklist, **not** a Production or hosted alpha approval.

## Automated on draft PR #10

- [x] Verified Clerk JWT normalization regression (`email_verified` → `identity.emailVerified`) added with RED/GREEN evidence; absent/false claims denied.
- [x] Concurrent open signup, ordinary member role, explicit allowlisted operator promotion, and suspension denial covered in `tests/integration/access.test.ts`.
- [x] Connection token format, TTL, rate limits, email binding, one-use/replay, races, revocation, self-acceptance, and block boundaries covered in `tests/domain/connection-policy.test.ts` and `tests/integration/connections.test.ts`.
- [x] Copy/share fallback and no false delivery claims covered in `tests/components/share-invite.test.tsx`.
- [x] Source head `7e85d1c47f1cffcbcbb7929a4498ac65179f57fd`: [GitHub Actions #40456881321](https://github.com/MohamedXIV/sengapp/actions/runs/40456881321) passed TypeScript, lint, **33/33 Vitest**, Next build and desktop/mobile **6/6 Playwright**. The follow-up evidence-only ledger commit also requires its own exact-head checks.
- [ ] Audit 6 npm advisories (2 moderate, 2 high, 2 critical); document safe remediation or residual risk before merge.

## Live Preview smoke — not completed

- [x] A verified Clerk Development account signed in on the stable branch Preview alias and reached an auto-created active **member** home with zero contacts (observed 2026-10-27). Operator elevation remains untested.
- [ ] Owner explicitly activates operator; an ordinary non-allowlisted verified account cannot.
- [ ] Independent verified account A signs up without any invite and gets a single member profile; repeated reloads do not duplicate.
- [ ] Independent verified account B also signs up without an invite; both begin with zero contacts.
- [ ] A issues link; B sees preview, chooses Accept; each sees exactly one connection. Opening the link alone does nothing.
- [ ] A second link is declined, revoked, wrong-email, replayed, expired and self-accepted unsuccessfully with no unauthorized connection.
- [ ] Sender/receiver blocked relation denies acceptance; private profile/settings/companion data stay inaccessible to others.
- [ ] Native share (where supported) and clipboard denied fallback, keyboard, light/dark, reduced motion.
- [x] Authenticated Connections viewport at 390×844: navigation and invite form present; page scroll width 375px within 390px viewport. Automated share/clipboard denial cases pass, but native-device share delivery remains untested.
- [ ] Sign-out and Clerk revoked sessions lose protected Convex access; inspect Preview logs without logging raw invitation codes.

## Scope boundary

Only isolated Clerk Development, Convex Preview and Vercel Preview are in scope. Do not merge PR #10, publish to Production, send invitations automatically, enable model API keys, or claim companion/BYOK or Resend functionality in Phase 0.
