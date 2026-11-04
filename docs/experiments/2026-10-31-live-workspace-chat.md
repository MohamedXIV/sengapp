# Workspace live chat integration — initial vertical slice (31 October 2026)

**Status:** Draft implementation on a branch stacked above the experimental [Cottage PR #20](https://github.com/MohamedXIV/sengapp/pull/20). Not a Production rollout.

## What changes
- Existing `MemberGate` has an `embedded` presentation mode. It keeps the same verified Clerk/Convex gating, profile setup, account locale and personal theme, but avoids a nested conventional AppShell sidebar in floating windows.
- `ConversationsList` is shared between `/chats` and the workspace panel; the latter selects authorized conversation IDs returned by the existing `api.conversations.listMine` query. No extra chat database, no fake message content.
- `DirectThread` is shared between `/chats/[conversationId]` and the panel. Its existing authorized `getOne`, pagination, send nonce/retry, sender labels, group details and composer remain intact. Embedded mode changes only the outer layout and back navigation.
- Both Dockview desktop and touch-window mobile reuse the same `ChatsPanel`. The normal /chats route stays available as the low-power, accessible fallback, including when Phaser/WebGL fails or is disabled.
- Demo Notes and timer are still browser-local. The user is never told they're synchronized production tools.

## Security boundaries / non-goals
- The lab is still publicly viewable as an illustrated prototype. **Private messages only render inside MemberGate once the current user is authenticated/authorized.** No query/mutation in Phaser; no public message previews or new Convex API.
- The server still decides membership and visibility. Client selecting an ID does not grant access; unauthorized calls must remain rejected.
- No production database migration, AI/companion access, guest rooms or persistence of private chats in browser-local room state.
- The existing UI still uses an authenticated /chats route; do not force the world on people with low battery, no WebGL, reduced motion or accessibility needs.

## Verification still required
- Exact-head automated TypeScript/lint/unit/Next/Playwright.
- Real multi-account signed-in Preview smoke: select DM/group, receive/send, scroll history, remove member and ensure revoked access, mobile keyboard, dark/light and Arabic RTL.
- Device power/memory and unresolved prior npm moderate advisories remain gates for production promotion; a green UI smoke alone doesn't close them.
