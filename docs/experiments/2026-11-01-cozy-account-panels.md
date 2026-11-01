# Profile & Appearance as protected Cozy windows — 1 Nov 2026

## Context
The first Cozy experiment implemented real DMs/People inside Dockview/React but still navigated to standalone Profile and Appearance pages. The owner wants a unified user-facing application that still permits a conventional lightweight fallback.

## Changes in this Draft
- The **same** Profile and Appearance forms are extracted into reusable editor components; both `/settings/profile` and `/settings/appearance` keep working unchanged for low-end/no-GPU use.
- Two new **Profile & privacy** and **Appearance** windows appear in Dockview desktop and draggable mobile window manager. They use `MemberGate embedded` exactly like chats, keeping Clerk + Convex authorization and the existing update/profile/presence mutations.
- AppShell legacy navigation redirects these entries to `/lab/cottage?panel=profile|appearance`, which focuses the correct window after page load. No account data becomes accessible to a guest.
- Forms remain accessible DOM/shadcn and scroll inside their windows; editable profile handle still respects its one-time update guard on Convex.
- The style theme remains browser-local at this stage; authenticated cross-device material preference sync is a separate step requiring a reviewed optional profile field, server validation and conflict handling.
- Nothing here modifies Production or relaxes P0/P1 security gates.

## Acceptance remaining
1. Exact-head CI and public Preview, mobile desktop browser checks.
2. Real owner signed-in Preview validation (profile edit and once-only handle semantics, appearance save/preview cancel, Arabic RTL, mobile keyboard).
3. Moderate npm dependency advisories, low-end device translucency/blur GPU cost, remaining merger sequence #20 → #22 → #23 → this PR.
