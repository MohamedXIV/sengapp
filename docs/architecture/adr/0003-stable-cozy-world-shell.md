# Sengapp canonical world route and compact tools — 1 November 2026

**Decision:** Promote the working Cozy World as the **primary public-facing app route `/`**, not a separate laboratory. The *world* is an application-shell/runtime concept. A forest cabin, ship's cabin, starship, future lake or other room theme is **user content/state**, never a new router path. Do **not** create `/cottage`, `/ship`, `/forest` routes for personalization. A stable `/` can host theme switching and preserve bookmarks.

## Routes and backwards compatibility
- `/`: real Cozy Workspace including Phaser background, authenticated React conversations/contacts, account windows and optional local tools, independently of which room/scene is selected.
- `/home` and `/lab/cottage`: compatibility redirects to `/`; old lab links with valid `?panel=chats|connections|profile|appearance|style|notes|focus` keep the selection.
- `/welcome`: preserves the earlier non-auth public welcome/info page if a lightweight promotional entry is useful.
- `/login`: remains a functional direct URL for recovery, bookmarks, OAuth/social flows, share links and invitation completion. **Clerk now defaults to `/` after login or signup**, except unfinished invite flows which still resume at `/invite`. The main world toolbar offers a Clerk **SignInButton modal** for ordinary entry, with /login fallback if a backend is unconfigured or an invite is pending.
- `/chats`, `/connections`, `/settings/*` are still accessible lightweight direct routes, not deleted or gated behind WebGL. Legacy navigation points to `/?panel=...`.
- `/invite` and any existing invitation/security state are not changed.

## Input and spatial UI
- One compact top toolbar: brand, Chats, People, optional Sign in. **No "Cottage Lab" badge, no duplicated back/Home icon and no huge row of unrelated tool buttons.**
- A bottom-edge gear/utility trigger opens a floating menu with Profile, Appearance, Window Materials, Notes, Focus, room editor, day/evening and safe reset operations. Uses real DOM buttons, keyboard-accessible native details/summary, supports reduced transparency.
- Camera zoom controls remain separate; overlay toolbar still takes **no height away from Phaser Canvas**. Desktop and mobile window managers, safe touch bounds, and chat authorization are unchanged.
- Color schemes continue to be driven by user Window Materials. Tool surface inherits CSS tokens rather than introducing a fourth competing style.
- Room theme switching and customizable scene packs are **later content tasks**; don't add distinct URLs or claim multiple themes are already implemented.

## Validation and release gates
Exact-head CI, desktop/mobile screenshot-level owner review, modal OAuth+signup test with real Clerk config, invite continuation, stable deep links, focus/accessibility and toolbar crowding. Existing npm audit moderate advisories, low-end Android graphics profiling, parent-first Draft merge gates all remain open. No Production merge.
