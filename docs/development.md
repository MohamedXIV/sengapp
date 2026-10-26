# Sengapp Phase 0 — Development

**Status:** Local development foundation. **Not deployed; no live OAuth session verified.**

## Requirements

- Node.js 24.x, npm, Git, and a personal Convex development deployment.
- A Google OAuth Web Client with the callback `http://localhost:3000/api/auth/callback/google`.
- A server-only operator email allowlist for the initial bootstrap.

## Setup

1. Run `npm install`.
2. Copy `.env.example` to `.env.local` and fill in the Convex URL/site URL obtained from `npx convex dev`.
3. Run `npx convex dev` with your **own** development project. It regenerates `convex/_generated`, including the Better Auth component references; the bootstrap types committed before a deployment exists are not a substitute for real codegen.
4. In that Convex development deployment, configure server-side secrets:
   - `npx convex env set BETTER_AUTH_SECRET <32-byte-random-secret>`
   - `npx convex env set SITE_URL http://localhost:3000`
   - `npx convex env set GOOGLE_CLIENT_ID <client-id>`
   - `npx convex env set GOOGLE_CLIENT_SECRET <client-secret>`
   - `npx convex env set SENGAPP_OPERATOR_EMAILS <verified-owner@example.com>`
5. Run `npm run dev`, open `http://localhost:3000`, and log in with Google.

**Security:** The operator bootstrap checks the server-side allowlist **and** Better Auth's `emailVerified` flag. It takes no user-selected role or email. Anyone may start a Google session, but no application data or member workspace is accessible without operator bootstrap or a redeemed invite.

Google OAuth and the Convex deployment need real owner-controlled credentials. Never place them in Git, web responses, screenshots, tests, or `NEXT_PUBLIC_*` variables. Do not publish the application until live authorization flows have passed.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Next.js development server |
| `npx convex dev` | Development backend and deployment-aware codegen |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint |
| `npm test` | Vitest domain and security suites |
| `npm run test:e2e` | Playwright desktop/mobile browser smokes |
| `npm run build` | Production build |

## Invitation lifecycle

- A verified operator calls the server-side action `invites.issue`. Its securely generated 32-byte code is shown once; only its SHA-256 hash is persisted.
- Invite links use `/invite#code=...` so a token does not reach access logs or referrer headers. The client removes the fragment promptly and keeps a temporary value in session storage across Google OAuth.
- A verified, nonmember identity submits `invites.redeem`. The Convex mutation validates expiry, identity restriction, uniqueness, handle and one-time state, then creates membership and consumes the code atomically.
- Operators can revoke unredeemed codes. Up to 20 unexpired, pending invites per issuer; bounded TTL of 1–720 hours.

## Explicit limitations

- This is an invitation and profile foundation, **not** a working chat or a ready public alpha.
- The Google provider and two-account concurrency/replay smoke cannot be validated without a configured Convex development project and OAuth credentials.
- The temporary `convex/_generated` bootstrap files are replaced by real `npx convex dev` output. The Better Auth component reference **must** be regenerated for the backend to work.
- No production emails, third-party AI calls, media storage, or deployment are configured.
- There is no E2EE in v0.1; authenticated backend processing is not end-to-end encrypted.
