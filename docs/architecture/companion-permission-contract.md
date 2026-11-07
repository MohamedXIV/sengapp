# Companion permissions and event contract — pre-provider foundation

**Status:** New, isolated Draft PR based on \`main\`, independent of UI v2 Draft PR #36. No AI SDK/provider/network actions, workflows, scheduled reminders, or UI changes. The planned Convex Agent architecture is documented in [ADR 0003 on UI v2](https://github.com/MohamedXIV/sengapp/blob/design/ui-v2-clean-room/docs/architecture/adr/0003-permissioned-convex-agents.md).

## What is implemented

- \`companions\`: per-profile identities, bounded to 3, a validated local handle, enabled/disabled state and monotonic revision.
- \`companionConsents\`: explicit opt-in from each active DM/group participant, for one companion in one conversation; recorded per membership epoch and revision.
- \`companionInvocations\`: a **validated request record only**, linked to an existing, own-authored, undeleted \`@handle\` message in the SAME conversation. Unique per owner nonce (idempotent), bounded at 20 requests/day, with cancellation. No job is scheduled.
- \`convex/lib/companionPolicy.ts\`: shared, server-only verification using the existing conversation and block guards for public operations. Internal dispatch verification additionally re-checks current membership, peer status, blocks, every participant's consent, companion owner/activation and all saved revision snapshots.
- \`internal.companionInvocations.contextForDispatch\`: private (not client-callable), returns **only the triggering message text** after checking all gates again. Returns null on normal access revocation, cancellation, updated source, group changes or owner disable; **never** scans previous messages.
- \`convex/lib/companionEvents.ts\`: typed domain contract for future validation/denial, stream text, tool status, approval and finish events. The event union does not run a tool or write to a stream.

## Explicit initial policy choices (subject to product review)

- One companion is owned by a user. **Only the owner can initiate their companion** in this first security slice; other members may consent or revoke their own consent. A future group-allowed inviter policy needs a separate authorization decision, not a client flag.
- Every currently active member of an existing DM/group must individually opt in for this particular companion; a one-member group requires its owner to grant explicitly. A new member invalidates older invocation snapshots; leaving and rejoining invalidates the returning person's old consent.
- Consent grants are restricted to a currently joined and active member; denied or revoked consent blocks any future context. Withdrawal and regrant increment a revision and do not resurrect stale validated invocations.
- A block between any group participant and the companion owner denies the scope. A direct block also denies it. Suspended profiles and disabled companions never unlock dispatch context.
- Context is **one own-authored mention message only**. No thread history, reply targets, private memories, attachments, other chats, group summaries, provider keys or connected apps are shared. Edits/deletes invalidate the existing request.
- No default AI provider or Gateway. A future dispatcher must call \`contextForDispatch\` immediately before each permitted model call and cannot trust a previous queued authorization, a UI state, or a previously valid consent snapshot.

## Remaining before the first real Milo

1. Review whether all-member, per-companion consent and owner-only invocation match Sengapp's user experience.
2. Decide a safe snapshot-to-dispatch atomicity strategy; reading context and making an external provider call cannot be one Convex transaction, so recheck immediately before dispatch and cancel safely on subsequent revocation.
3. Wire a real \`@mention\` intent/selector into canonical human messages; no UI v2 mock should trigger a provider call by itself.
4. Add approved execution and streaming on a separate branch using \`@convex-dev/agent\` and a directly configured provider (Gateway optional). Protect internal functions, cancel/recheck between tool steps.
5. Add signed tool approvals, task ownership, scoped account integrations, quotas, cost visibility, and negative cross-account tests for every new event type.
6. Avoid a second human message store. Preserve existing Convex DMs, groups, history-visibility rules, and message IDs.

## Tests

\`tests/integration/companion-permissions.test.ts\` uses multiple real Convex identities and \`convex-test\`. It checks outsider/suspended/unverified users, individual consent, owner-only invocations, replay/nonce, no historical message leakage, DM blocks, edited/deleted messages, disable/re-enable, cancellation, all-member group consent, new members and rejoin history, and revocation invalidating prior requests.

**Important:** These tables and public calls are new in this isolated Draft PR. Nothing has been pushed to a live Convex deployment.
