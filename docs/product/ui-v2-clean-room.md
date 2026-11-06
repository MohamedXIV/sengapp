# Sengapp UI v2 — clean-room design checkpoint

## Decision

The previous PR #35 was rejected and closed without merge. It restyled the old presentation rather than creating a new visual language. None of its code is the design starting point.

This study starts directly from main on a distinct branch. It does not modify the home route, Classic shell, existing chat pages, profile, or production UI. The first checkpoint is a brand-new conversation reference at /ui-v2. All visible conversations and messages are local fixtures.

## Art direction

The owner's reference image is a warm, approachable, refined messenger with a carefully spaced column layout and subtle personality. Our interpretation is Warm Editorial Minimalism: calm warm neutrals, one botanical accent, editorial typography, intentional hierarchy, restrained shadows and few decorative surfaces. The reference is visual guidance, not a component library or a directive to imitate its scene artwork.

Visual quality is gated by human review, NOT by CI status.

## Non-negotiable boundaries

- Later retain: Clerk, Convex schema/mutations/queries/authz, message and connection domain rules, Phaser room scene logic, Dockview window behavior, and privacy rules.
- Never transfer: legacy app-shell JSX, old chats rendering components, old Appearance UI, old navigation markup, old CSS recipes, or glass/paper window skins.
- UI v2 lives in src/ui-v2 and owns all its visual styles and tokens. It currently imports only React, lucide-react and its own local mock data.
- The /ui-v2 route is a sample-data-only visual checkpoint, with no authentication, Convex calls or production writes.
- After visual signoff, extract display-only components with explicit props/callback contracts and add small authenticated adapters to existing domain/backend APIs.
- Keep ONE shared Design System and ONE set of feature presentation components for both Classic and Cozy. Experience shells organize them differently without diverging visually.
- Classic: collapsible navigation and chat list; optional details.
- Cozy: same messages, people and preferences inside dismissible/resizable windows; no nested second sidebar in windows.
- Mobile: prioritize one view at a time. Preserve navigation, chat selection and details without overlapping panels.
- Preferences: bounded accent/radius/shadow/density/light-dark values. No arbitrary CSS, no independent glass/paper appearance theme.
- Cover desktop/mobile, EN/AR RTL, light/dark, reduced motion, keyboard navigation, and long messages before release approval.
- No production route change or deletion of legacy code until the full replacement is visually approved.

## Checkpoint 1 implementation

src/ui-v2/studio provides a complete standalone reference conversation: filterable chat list, sample timeline, replies, quick reactions, editable local composer, optional details, hideable navigation, responsive mobile sections, and self-contained appearance controls with browser-local preferences.

The interactions simulate UI only. No real conversation is created and nothing is sent.

Next: human visual acceptance for the first reference screen; then Arabic/RTL and mobile design passes; then build actual shared presentation components and integrate the existing backend without importing legacy UI.
