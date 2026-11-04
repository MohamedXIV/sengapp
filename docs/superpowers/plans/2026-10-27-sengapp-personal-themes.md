# Personal Themes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every Sengapp account durable, private, safe appearance customization beyond dark mode.

**Architecture:** Store an optional strictly validated `visualPreferences` object on each Convex profile. Resolve a curated theme preset and bounded accent/font/radius/density tokens into CSS variables on the app shell; preview changes locally and persist them with an authenticated Convex mutation.

**Tech Stack:** shadcn/ui, Tailwind CSS 4, Next.js, Convex, Zod, next-themes, React.

**Spec:** `docs/superpowers/specs/2026-10-27-sengapp-ui-foundation-personal-themes-design.md`

## Global Constraints

- Run after the stack/shadcn plan, on canonical draft PR #10.
- Presets: `acorn`, `forest`, `dusk`, `ocean`.
- Accents: `amber`, `coral`, `sage`, `teal`, `blue`, `violet`.
- Fonts: `system`, `inter`, `nunito`. Radii: `subtle`, `soft`, `round`. Densities: `comfortable`, `compact`.
- Existing `themePreference` remains independent: `light`, `dark`, `system`.
- No arbitrary CSS/HTML/font URLs, unbounded hex overrides or sharing user's theme automatically with others.

## Review Focus

- Missing optional preference on an older profile resolves known defaults (Task 1).
- Forged invalid preset/hex/font/metadata rejected server-side (Task 1).
- Theme isolation when signing out and into a second account on the same browser (Task 2).
- Save failure during live preview restores previous persisted theme (Task 3).
- OS appearance change during system mode and reduced motion on mobile (Task 2/3).

---

### Task 1: Preference contract and Convex persistence

**Files:**
- Create: `src/lib/themes/preferences.ts`.
- Modify: `convex/schema.ts`, `convex/profiles.ts`.
- Test: `tests/domain/theme-preferences.test.ts`, `tests/integration/theme-preferences.test.ts`.

**Interfaces:**
- `VisualPreferences`: `{ preset: ThemePresetId; accent: ThemeAccent; font: ThemeFont; radius: ThemeRadius; density: ThemeDensity }`.
- `resolveVisualPreferences(input?: Partial<VisualPreferences> | null): VisualPreferences`.
- `profiles.updateVisualPreferences(args: VisualPreferences): Promise<{ updatedAt: number }>` authenticated; only patches current profile.

- [ ] **Step 1:** Add failing tests for exact enums, missing preferences defaults, unauthorized mutation, cross-account isolation and malformed payload.
- [ ] **Step 2:** Add optional profile field plus mutation and shared types/validators; use server-side Convex value validators.
- [ ] **Step 3:** Run unit and Convex integration tests, typecheck; commit.

### Task 2: Token resolver and account-aware theme application

**Files:**
- Create: `src/lib/themes/presets.ts`, `src/components/themes/personal-theme-provider.tsx`.
- Modify: `src/app/globals.css`, `src/components/providers.tsx` or authenticated app shell boundary.
- Test: `tests/components/personal-theme-provider.test.tsx`.

**Interfaces:**
- `getThemeTokens(preferences: VisualPreferences, appearance: 'light'|'dark'): Record<string,string>`.
- Applies only whitelisted CSS variables and root visual attributes; clears them on profile switch/logout.

- [ ] **Step 1:** Add failing tests for all four presets, independently light/dark, font/radius/density, unavailable profile and account switching.
- [ ] **Step 2:** Implement preset maps, semantic token application and cleanup without exposing the signed-in theme to public pages.
- [ ] **Step 3:** Check contrast, hydration, RTL, reduced motion, live OS appearance change; run tests/build; commit.

### Task 3: Appearance controls, preview and persistence

**Files:**
- Create: `src/features/profile/appearance-settings.tsx`.
- Modify: `src/app/settings/profile/page.tsx`, relevant profile shell integration.
- Test: `tests/components/appearance-settings.test.tsx`, `tests/e2e/access.spec.ts` (or dedicated appearance spec).

**Interfaces:**
- Consumes `VisualPreferences`, `getThemeTokens`, `profiles.updateVisualPreferences`; uses shadcn controls from modernization plan.

- [ ] **Step 1:** Add failing test for preset/swatch/font/radius/density selection, preview, cancel, reset, Save, error rollback.
- [ ] **Step 2:** Implement accessible shadcn form, live local preview and a single explicit save mutation; keep Light/Dark/System separately controllable.
- [ ] **Step 3:** Verify cross-account/cross-device persistence and six key visual combinations, responsive, RTL, keyboard and focus.
- [ ] **Step 4:** Run complete typecheck/lint/unit/build and targeted browser checks; commit and document remaining human acceptance.
