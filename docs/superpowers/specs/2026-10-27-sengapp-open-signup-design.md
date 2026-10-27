# Sengapp — Open Signup, Private Connections & Companion Budget Amendment

**Date:** 2026-10-27  
**Status:** Proposed for owner review; not an implementation authorization  
**Applies to:** Sengapp v0.1 design approved 2026-10-26, especially §§1, 3, 4.1, 4.1a(2), 6 and 7  
**Existing implementation:** Draft PR #10, `feat/phase0-invite-foundation` (currently invite-to-register)

## Intent and user decisions

Sengapp must be useful to an individual before they have friends. The owner explicitly approved:

1. **Approach A — one account model:** Anyone may register using Clerk and receive an ordinary Sengapp profile. There is no `solo` account type, upgrade ceremony or signup invite.
2. **Private social graph:** People connect by invitations or approved requests; registration alone gives no access to other users, conversations or companions.
3. **Initial invitation delivery:** Generate a link that users can copy. Offer the browser/OS native sharing sheet where supported (which may show WhatsApp, other messengers or mail). **Defer Resend and outbound app-owned email delivery** until a later phase.
4. **Companion costs:** Add enforceable usage limits for Sengapp-funded AI and a **bring-your-own-key (BYOK)** option. Companion interaction is allowed without human contacts once the AI slice is implemented.

These decisions supersede v0.1's prior *invite-only signup* requirement, not its privacy, consent or closed-social-space requirements.

## Goals

- A newly verified Clerk user can create a private profile and use personal settings without any invitation or other member.
- Later, that account can privately converse with its own companion without joining a human conversation (subject to quota/provider availability).
- A user can invite someone to connect by sharing a link; a recipient who has no account may sign up first, then choose whether to accept.
- No public people directory, unsolicited stranger discovery, implicit friendship, public feed, or exposure of contact lists.
- Server-side identity, relationship, messaging and agent-context authorization stays strict.
- Stay affordable and mobile-first, with minimal new services and no extra database.

## Non-goals and anti-goals

- No Resend integration, sending email from Sengapp servers, WhatsApp Business API or messaging-service account linking in Phase 0.
- No automatic message to a WhatsApp contact. Native share opens the user's chooser; the user performs any final send.
- No launch promise for AI before its planned companion vertical slice. Phase 0 establishes identity and social boundaries first.
- No unrestricted AI usage or BYOK keys handled in client storage.
- No public user search, bulk importing contacts, automatic invites, or accepting a connection just by opening a shared URL.

## Approaches considered

| Approach | Mechanism | Trade-off | Decision |
| --- | --- | --- | --- |
| **A — unified profile** | Every verified signup creates a normal private member profile, initially with zero contacts | Must separately guard social capabilities and usage quotas | **Owner chose A** |
| B — two account tiers | A solo/agent-only account is upgraded to social membership on invite | Extra status, migration, branches and support friction | Rejected |
| Original invite-only signup | Require invitation before an application profile | Excludes potentially useful solo-companion users | Superseded |

For delivery, native share plus copy is the Phase 0 option. Resend may later deliver the *same server-issued invitation link* by email without changing relationship authorization.

## Account and authorization design

- **Clerk** owns authentication, email verification and sessions. **Convex** owns the application profile, social graph, companion ownership and authorization.
- The first trusted authenticated request creates an idempotent `profiles` row keyed by Clerk subject; subsequent requests return it. Require server-verified identity and a verified email claim; if claims or Convex auth are broken, show a specific authentication/setup error and allow retry, **never** silently fabricate a member.
- Defaults: ordinary `member` role, active profile, no connections, private data, conservative AI limits. Preserve profile preferences and existing accessibility defaults.
- The operator role remains privileged and restricted by verified-email allowlist; registration can never grant operator automatically. The current operator bootstrap test still fails with `VERIFIED_SIGN_IN_REQUIRED` in Preview and must be diagnosed without weakening these checks.
- Signed-in does not mean entitled to any other account's data. DMs, group reads, files, member listing and agent invocations each enforce current server-side authorization.
- Remove the old signed-in-but-not-invited membership gate. Public routes may lead into private onboarding/profile setup, not the operator bootstrap screen.

## Invitation and connection design

- **Separate connection invitations from registration.** Current `invitations` table and actions are designed to confer account membership and cannot be reused unchanged. Rename/refactor that purpose into a new friendship/connection request domain; do not blur authority.
- An authenticated member can create a rate-limited, revocable, expiring one-use **connection invitation**. Store a hash, not a raw token. Link URL is displayed to the sender for copying/sharing. Optionally bind the link to the verified recipient email when supplied; otherwise the first verified accepting account claims it.
- Clicking the link displays the sender's limited invite context and **Accept / Decline**. Never auto-connect on visit, signup or preview. The issuer cannot accept their own invitation. On acceptance, atomically establish the relationship and consume the token. Replay, cross-account targeting, revoked/expired codes and races fail cleanly.
- Existing mutual blocks and privacy restrictions take precedence. A shared link is a capability: do not place it in analytics, logs or preview metadata; avoid accidental third-party disclosure and clearly warn users that an unbound link is transferable.
- A user may start with zero contacts; invitations and accepted requests are separate from group invites. A new connection **does not** grant rights to historic or unrelated conversations, attachments or a private companion.
- For now, use explicit copy and optional `navigator.share({ title, text, url })` from a direct button press in HTTPS. Show a graceful copy fallback when Web Share API is unsupported, disabled or canceled; do not claim a message was sent. WhatsApp may be one of the OS-provided targets but is not guaranteed.

## AI companion and cost model

- Within the planned v0.1 companion slice, the **same normal profile** can create/use a private companion with zero social connections.
- **Sengapp-funded mode:** provider/model allowlist; per-user usage caps (requests and token/cost budgets) plus overall deployment budget and kill switch; server checks before calling a model and writes usage records. Exhaustion explains the limit and does not silently charge another provider.
- **BYOK mode:** user explicitly supplies a supported provider key; app encrypts it at rest using a server-managed secret and accesses it only server-side for that user's authorized requests. Never put it in browser localStorage, logs, the client bundle, error text or another user's agent context. Allow replacement/removal, show last-four/status only, and make model/provider routing explicit.
- BYOK avoids Sengapp paying model inference charges, **not** all app operating costs. Enforce request/rate/tool limits even for BYOK, validate ownership and consent, and clearly label which account/provider is billed. If user key is missing/invalid/rate-limited, fail visibly rather than secretly spend the shared key.
- Exact initial allowances, supported BYOK vendors, storage encryption/key rotation and usage reset windows belong to the companion implementation plan. No credentials or paid provider access are presumed available now.

## Phase scope and sequencing

### Phase 0 change to existing draft PR #10

1. Replace invite-to-register gate with auto-provisioned, private, verified profiles.
2. Keep privileged operator administration separate; repair and verify the Clerk→Convex verified-claims integration.
3. Refactor registration-invite domain to friendship/connection invitation tokens, links, acceptance, revocation and safe server authorization.
4. Add **Copy invite link** and feature-detected native **Share**. No Resend credentials, API calls or domain setup.
5. Update docs/tests for open onboarding, new authorization boundaries, link transfer, races, retries and two-account Preview smoke. Resolve existing dependency advisories before merge.

### Later companion slice

6. Ship private companion for any profile including zero-contact users.
7. Apply server-enforced Sengapp-funded quotas and add secure BYOK with explicit ownership, per-provider validation and redaction tests.

### Optional later delivery

8. If worthwhile, integrate Resend transactional invitation email behind server-side rate limits/domain verification. It transports the same links; Convex still decides acceptance. Do not block Phase 0 on this.

## Acceptance and failure scenarios

- User A registers with Clerk verified email, gets exactly one ordinary profile on repeated/racing bootstraps, sees private home, no operator privileges and no connections.
- User B does likewise with no invite. A creates link, shares or copies it; B can see context and accept; neither sees each other's private data until the relevant relationship/conversation permissions grant it.
- A malformed, replayed, expired, revoked, self-redeemed, recipient-mismatched, already accepted or blocked invitation creates no relationship.
- Sender shares via native picker on supported devices; when unavailable, **Copy link** still works. Canceling picker displays no false delivery confirmation.
- Unverified/missing Clerk claims fail closed with helpful error copy; no unauthenticated writes or bypass through URL or client conditionals.
- Companion users with zero friends can converse once that feature ships; exhausted shared quota, invalid BYOK key and forbidden access fail safely with no cross-user leaks.

## Open builder decisions (not owner assumptions)

- Exact `contactInvitations`/`relationships` schema and transaction/indices, link expiry, per-member invitation rate, and whether recipient email binding is exposed in the first UI.
- How to map any non-production existing `invitations` data; there are no known real invited members yet. Avoid unnecessary legacy save compatibility.
- Exact AI spending limits, approved providers, secure secret-handling implementation and operator budget UI in the companion phase.

## Approval boundary

This document records the owner's direction but **requires explicit owner approval before product-code implementation**. It does not authorize sending real outbound messages, connecting real users, purchasing services, relaxing server authorization, changing Production or merging PR #10.
