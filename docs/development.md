# Sengapp Phase 0 — Development

**Status:** Local invite-only foundation. **Not deployed; no live Clerk sign-in has been verified.**

## Requirements

- Node.js 24.x, npm and access to Sengapp's **own** Convex development project (not RepoPilot's).
- A Clerk development application with the **Convex integration** enabled.
- A verified email address for the initial operator and a server-side operator email allowlist.

## Setup

1. Run `npm ci --legacy-peer-deps` and copy `.env.example` to `.env.local`.
2. In Clerk Dashboard, create/select the Sengapp application. Enable the Convex integration. Copy the **publishable** and **secret** API keys to `.env.local`. Configure the custom sign-in page `/login`.
3. In Clerk's `convex` JWT template, preserve its Convex audience (`aud: "convex"`) and provide signed user claims:

   ```json
   {
     "aud": "convex",
     "email": "{{user.primary_email_address}}",
     "email_verified": "{{user.email_verified}}",
     "name": "{{user.full_name}}"
   }
   ```

   The template name must be **`convex`**. Do **not** hard-code `email_verified: true` or use client-editable metadata. `email_verified` must resolve to a **boolean** from Clerk. If that claim is absent/false, Sengapp refuses operator bootstrap and invite redemption.
4. Configure **Sengapp's Convex development deployment**, not another project's:
   - `npx convex env set CLERK_JWT_ISSUER_DOMAIN https://YOUR-CLERK-FRONTEND-API` (the exact Clerk Frontend API issuer URL, including `https://`).
   - `npx convex env set SENGAPP_OPERATOR_EMAILS verified-owner@example.com` (server-only comma-separated allowlist).
5. Run `npx convex dev` to link the Sengapp project, sync `convex/auth.config.ts`, and regenerate the deployment-aware files under `convex/_generated`. This project has a **bootstrap-only** generated API for offline checks; live codegen is mandatory before testing real sign-in.
6. Copy the generated `NEXT_PUBLIC_CONVEX_URL` / `CONVEX_DEPLOYMENT` into `.env.local`, start `npm run dev`, and open `http://localhost:3000`.
7. Log in with Clerk, click **Initialize operator** on `/home`, then issue a one-use invite from `/admin/invitations`. Test a second verified Clerk account redeeming it on `/invite`.

> Auth integration is **not** an invitation policy: Clerk signs users in, Convex checks their signed identity and Sengapp profile for **every** member operation. Uninvited Clerk users cannot read or mutate member data. The operator bootstrap accepts only a verified Clerk email in the server allowlist and is idempotent.

**Credentials:** Never place Clerk secrets in Git, responses, screenshots, tests, or `NEXT_PUBLIC_*` variables. The issuer URL and operator allowlist belong to **Convex server environment**. Convex production is not configured by this change.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Next.js development server |
| `npx convex dev` | Development backend sync and real codegen |
| `npm run typecheck` | TypeScript validation |
| `npm run lint` | ESLint validation |
| `npm test` | Vitest domain and security suites |
| `npm run test:e2e` | Playwright desktop/mobile browser checks |
| `npm run build` | Production build |

## Invitation lifecycle

- A verified operator calls `invites.issue`. Secure server-side randomness produces a 32-byte code shown once; only its SHA-256 hash is persisted.
- Invite links use `/invite#code=...`, keeping the token out of HTTP access logs and referrer headers. The browser removes the fragment and stores the pending token temporarily in session storage across Clerk sign-in.
- A verified identity with no member profile calls `invites.redeem`. The atomic Convex mutation checks expiry, identity/email restriction, handle uniqueness, one-time use, then creates membership and marks the invitation redeemed.
- Operators can revoke unused codes; up to 20 unexpired pending invites per issuer; TTL 1–720 hours.

## Explicit limitations

- This is invite-only identity/profile infrastructure, **not yet the messaging app**.
- The Clerk integration, Convex link and two-account live smoke must be completed with owner-controlled credentials before the PR can be marked production-ready.
- JWT claim freshness follows Clerk's token lifecycle. Live checks must include signed-out/revoked sessions and an unverified-address attempt.
- No email sending, third-party AI calls, media storage or production deployment is configured.
- There is no E2EE in v0.1.
