# Sengapp Phase 0 — Development and Preview

**Status (2026-10-27):** Open verified signup and private connection-invitation implementation in draft PR #10. Vercel/Convex **Preview** is deployed; this is not Production and not yet a working messenger or AI companion.

## Prerequisites

- Node.js 24.x, npm; Sengapp's own Convex project and Clerk **Development** application.
- An owner-controlled verified Clerk email, optionally present in Convex's private operator allowlist.
- No Resend, WhatsApp integration, third-party model API keys, or companion BYOK configuration is needed in Phase 0.

## Clerk → Convex verified identity

1. Install with `npm ci --legacy-peer-deps`, copy `.env.example` to `.env.local`.
2. Configure Clerk application keys, authentication on `/login`, and native `ConvexProviderWithClerk`.
3. In Clerk Development Dashboard → Sessions → **Customize session token**, save signed claims (the provider uses the Clerk `__session` token):

   ```json
   {
     "aud": "convex",
     "email": "{{user.primary_email_address}}",
     "email_verified": "{{user.email_verified}}"
   }
   ```

   `email_verified` must be a boolean derived from Clerk, never hard-coded or supplied by client-editable metadata. Convex normalizes this signed OIDC claim to `identity.emailVerified`; server functions require `=== true`. Missing/false/malformed verification or missing email fails closed with `VERIFIED_SIGN_IN_REQUIRED`.

4. Configure the **Sengapp** Convex deployment:
   - `CLERK_JWT_ISSUER_DOMAIN`: exact Clerk frontend API issuer URL, including `https://`.
   - `SENGAPP_OPERATOR_EMAILS`: optional comma-separated verified operator addresses, **server-side only**.
   - `convex/auth.config.ts` expects application audience `convex`.
5. Run `npx convex dev` on the intended Development deployment to sync functions and regenerate `convex/_generated`. Use the correct `NEXT_PUBLIC_CONVEX_URL` and `CONVEX_DEPLOYMENT`; run `npm run dev`.

## Open signup and explicit operator activation

- Any verified Clerk signup opening `/home` invokes `profiles.ensureMine({})` if needed, transactionally creating one **active member** profile. No invite code or contact is required.
- Calling `ensureMine` again returns the existing ID; it never restores a suspended account and never elevates roles.
- To activate the vetted owner only, visit `/admin/invitations` and use the explicit **Initialize operator** action. `profiles.bootstrapOperator` checks the verified email against the server allowlist and promotes an existing active member. Ordinary users cannot promote themselves.
- Signed-out visitors and identities missing valid verification claims have no member access. The profile gate exposes a retry or verification error rather than granting a fallback role.

## Private connections

1. Any active member visits `/connections` and chooses **Create invitation link**. Optional recipient email binding and note, TTL 24/72/168 hours.
2. A 32-byte random Base64URL code is returned once to the sender; only its SHA-256 hash and a short hint are stored in Convex. The link is `/invite#code=...`. The fragment is immediately removed from the recipient's address bar and stored temporarily in same-origin `sessionStorage` across sign-in.
3. The signed-in recipient reviews the sender's display name/note and explicitly **Accepts** or **Declines**. Merely opening a URL or registering never creates a relationship. `connections` uses one canonical unordered pair; approval and code consumption are atomic.
4. Blocks, expired/revoked/used codes, wrong verified recipient email, self-acceptance and existing connections prevent acceptance. The code remains unconsumed after rejected attempts.
5. At most 10 unexpired pending invites and 20 created in a rolling 24-hour window per member. Sender can revoke their own pending invite.
6. **Copy link** works on supported browsers. If clipboard permission is denied, the visible input remains selectable. Native **Share** appears only where supported and opens the device's share sheet: the app never automatically sends WhatsApp or email, and cannot attest that a message was delivered.

No public directory, automatic DM, companion access, or access to historic conversations is granted by a connection. No email addresses are made discoverable in public lists.

## Preview deployment boundaries

- Vercel Preview branch: `feat/phase0-invite-foundation`; canonical draft [PR #10](https://github.com/MohamedXIV/sengapp/pull/10).
- Build command: `npx convex deploy --cmd-url-env-var-name NEXT_PUBLIC_CONVEX_URL --cmd 'npm run build'`.
- Use the **Convex Preview deploy key**, not a Production/Development deploy key, so the backend is isolated. Scope `CLERK_JWT_ISSUER_DOMAIN` and `SENGAPP_OPERATOR_EMAILS` as necessary for Preview deployment.
- Clerk Development sessions are **origin-bound**; a new Vercel Preview URL may require signing in again. Never paste tokens or secrets into the repository.
- Do not merge, promote, or set Production keys without the human two-account acceptance checklist in `docs/testing/phase0-acceptance.md` and security review.

## Verification

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
```

CI executes the same gates on the draft PR and uses a no-credentials Next.js build for unauthenticated smoke. To test *live* authentication/connection functionality, use owner-controlled accounts on the isolated Preview backend.

## Deferred

- Resend-managed transactional email is a later delivery option.
- The AI companion is a later vertical slice. Sengapp-funded inference needs per-user quotas and global budgets; BYOK needs encrypted server-side key storage, replacement/removal, owner isolation and clear billing. None of this is implemented or billed in Phase 0.
- No E2EE promise or public alpha claim. Existing npm advisories require separate triage before Production.
