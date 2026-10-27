# Sengapp — Modern UI Foundation and Personal Themes

**Approved direction:** 2026-10-27, owner selected **B: curated themes plus personal customization**. This specification refines that approved choice without expanding it into a free-form theme editor.

## Intent

Before Phase 1 human messaging, modernize Sengapp's early application stack and make shadcn/ui the default source of UI primitives. Give each signed-in member a recognizably personal visual experience that follows their account between devices. Keep light/dark/system appearance independent from the chosen look-and-feel.

## Scope and guardrails

- Upgrade actively used framework, styling, testing, and integration dependencies to current **stable, mutually compatible** releases; verify with npm peer-resolution and real test/build gates. At approval time: Next.js 16.4, React 19.3, Tailwind CSS 4.3. Do not force upgrades that break Clerk, Convex, or React support.
- Use Node.js 24 for tested execution if supported by all project runtimes; record requirements in package metadata and CI. No React canaries, experimental dependencies or automatic future major upgrades.
- Adopt first-party shadcn components using its current CLI/registry, CSS variables and token conventions. Prefer shadcn Button, Input, Textarea, Select, Card, Badge, Switch, Label, Alert, Separator, Sidebar/Sheet/Dialog where applicable; build custom primitives only when a needed behavior is not covered.
- Preserve public signup, verified identity, server-side access rules, one-shot connection invitations, profile editing, reduced-motion and RTL behavior. No change to Production, no messaging/AI/media scope expansion.
- No unvalidated arbitrary CSS or user-supplied selectors. No custom plugin/theme uploads or public marketplace in this milestone.
- Accessibility is integral: contrast, legible typography, keyboard, screen readers, mobile responsiveness and motion preferences.
- Maintain the existing draft PR #10; never silently merge or deploy to Production.

## Personalization model

A theme is composed of independent dimensions:

1. **Preset**: `acorn`, `forest`, `dusk`, `ocean`. Each preset defines coherent base surface/text/semantic tokens for both light and dark modes.
2. **Accent**: one of `amber`, `coral`, `sage`, `teal`, `blue`, `violet`. A validated, contrast-tested palette—not arbitrary CSS.
3. **Typography**: `system`, `inter`, or `nunito` (only load approved fonts and retain system fallback).
4. **Radius**: `subtle`, `soft`, `round`.
5. **Density**: `comfortable`, `compact` (never shrink hit targets below accessible thresholds).
6. **Appearance**: existing `themePreference`: `light`, `dark`, `system`, independent of the preset and controls.

Existing users with no visual customization default to `acorn` plus familiar appearance behavior. The existing `themePreference` field is retained. Store optional `visualPreferences` on the authorized user's Convex profile to avoid disruptive required-field migration; resolve the above defaults at the application boundary. Every save validates the exact enums on the server and does not touch any other profile.

## UI experience

- `Settings > Appearance` offers four selectable preset previews, contrast-safe accent swatches, font, radius and density controls, and Light/Dark/System.
- Changes preview **immediately** inside a previewable application area before saving. Explicit Save and Cancel/Reset restore proper prior state, including on save error. Settings are preserved on reload and signed-in devices.
- Color mode continues to respect system preference through next-themes. Only the current member's look and feel changes; other members' themes do not affect chat or their own appearance.
- The public unauthenticated shell uses the branded default; no private appearance data is exposed to anonymous users.
- Theme application uses semantic CSS tokens and guarded root data attributes; no per-component hardcoded colors. Text stays selectable DOM; future PixiJS pets must inherit theme accents without owning text.
- Gracefully handle delayed Convex profile loading and sign-out without flashing private stale preferences onto another user's session.

## Acceptance

1. Install/build/lint/typecheck/tests on supported Node; Next.js 16 routing/proxy and Tailwind v4 verified.
2. Actual `src/components/ui` files created via shadcn tooling; visible routes use them instead of ad-hoc controls, with no material access-flow regression.
3. Two signed-in accounts select distinct themes; changes persist and never cross accounts; stale/invalid preference inputs are rejected server-side.
4. System/light/dark work with each preset, RTL/mobile/reduced-motion and keyboard focus work.
5. Invitation issue → copy/share → accept/reject/revoke → replay remains correct on matching Preview.
6. Draft PR stays isolated pending independent review, security audit and owner acceptance.

## Deferred

Unbounded custom CSS, per-user uploaded fonts, animated theme marketplace, messaging skins dictated by the sender, PixiJS companions, AI SDK integration, and any new user-facing messaging feature.

## Approaches considered

- A: preset-only — simplest, but not enough personal expression.
- **B: presets + bounded controls — owner-approved** and safely extensible.
- C: arbitrary full theme editor — rejects accessibility and security tradeoffs for this milestone.
