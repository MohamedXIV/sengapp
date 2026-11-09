# Sengapp UI v2 — Design, Localization, Color and Motion Roadmap

> **Owner decisions captured 9 November 2026.** Sequence and acceptance gates, not deadlines. This is the **canonical plan for visual/UI v2 work**, linked from the [overall product roadmap](roadmap.md). The existing [messaging/privacy release plan](roadmap.md#v01--build-a-messenger-people-trust) remains authoritative for live features and security.
>
> **Tracking issue:** [#39 — UI v2 bilingual, colorful personal messenger and motion roadmap](https://github.com/MohamedXIV/sengapp/issues/39).
>
> **Current work:** [Draft PR #36](https://github.com/MohamedXIV/sengapp/pull/36) is the clean-room shadcn baseline; [Draft PR #38](https://github.com/MohamedXIV/sengapp/pull/38) adds shared Classic/Cozy shells and the first cleanup. Neither is merged into `main`. The `/ui-v2` demo uses local/mock state, **not** authenticated Clerk/Convex messaging, real companion consent, providers or AI execution. PR #37's permission contract is separately gated.

## Why this track exists

Sengapp is a cozy **personal messenger** for a private circle, not an enterprise dashboard, Odoo-like ERP, work tracker, or clone of a legacy UI. The early UI v2 experiment is structurally sound but still visually too monochrome, stark and clinical. Correct this through composition, genuine chat-first navigation, typography, free color choices, illustration and restrained motion—not by fighting official shadcn components with repeated CSS patches.

### Decisions that should not be lost

| Area | Agreed direction |
| --- | --- |
| Architecture | **Keep Classic and Cozy** as two distinct shells that share the same messaging/state/permissions and controls. Classic must work without Phaser. No extra route per environment. |
| Components | Prefer **native shadcn/ui primitives and official patterns first**; customize semantic tokens, data and layout, not duplicate component implementations. |
| Current chrome | No large demo-like “New Message” call to action at the top. Chat header stays compact (avatar, title, short status/member count); **no companion setup inside chat header**. |
| Companion | One owner-controlled place to set name, @mention alias, and eventually avatar/personality. Existing `Companion` section in shared right drawer is a UI-only preview, not an AI service. |
| Composer | Floating/elevated, soft shadow, modest width, light expansion/shadow on focus and tactile send feedback. Send, mention and attachment behavior must stay accessible. |
| Utility drawer | Shared right-side **overlay Sheet** for Appearance and future utilities; it **must not push or resize** Classic conversation or Cozy Phaser stage. Close via Escape/outside click where appropriate. |
| Languages | First-class **English and Arabic** localization using existing `next-intl` direction. RTL/LTR layout, natural copy, mixed-script messages, dates, keyboard/focus and mobile must be reviewed from the start. |
| Modes | **Light, Dark, System** modes. Default Light unless the user chooses otherwise; System follows OS. Default Light avoids pure white; Dark avoids flat pure black. Both modes have designed surfaces and depth. |
| Colors | User can choose **arbitrary colors**, not just four locked accent presets: independent **Primary, Secondary, Tertiary/Accent** plus App Background and Surface; chat wallpaper/background may be customized separately. Presets are optional editable starting points. |
| Freedom + readability | Do not restrict users to the suggested palette. Derive companion shades/states where possible, show contrast warnings or suggest legible text colors without silently overwriting their preferences. Support independent Light/Dark values. |
| Motion | Subtle, useful interactions: composer focus elevation/slight scale, send press/release/short send motion, message appearance, reactions pop/bounce, drawer/menu transitions, and selected-list feedback. Don't animate everything. |
| Platforms | Low-bandwidth/mobile-friendly, semantic DOM for chat, keyboard and screen-reader support, high contrast, `prefers-reduced-motion`, no false presence/unread data or simulated AI execution. |
| Art | Optional illustration, patterns, wallpaper and small friendly details; no huge mandatory downloads or visual noise. Phaser's room should remain genuinely visible in Cozy. |

## Delivery order — small reviewable batches

**B1 — Cleanup / minimal chat chrome — implemented on Draft PR #38, acceptance still open.**
- Compact chat header; remove chat-level new-conversation and companion name/alias buttons.
- Centralize identity controls inside a shared utility drawer; overlay on desktop/mobile.
- Elevate the shared InputGroup composer; keep shadcn's behavior.
- **Review gate:** verify actual desktop/mobile layouts and update legacy Playwright expectations. At 9 Nov, TS/lint/Vitest/Next build passed, but [the latest Playwright CI run](https://github.com/MohamedXIV/sengapp/actions/runs/42620830746) **failed** on tests still targeting removed chat-header controls. Do not mark end-to-end acceptance complete yet.

**B2 — Cross-cutting foundation: localization, modes, semantic color tokens — next.**
- Audit existing `next-intl` messages and prior RTL/theme behavior before changing UI v2; do not rewrite the established localization architecture.
- Translate **all** UI v2 labels/settings/empty states; verify Arabic/English switch without losing draft, selected chat or view state. Apply RTL to sidebar/drawer/menu geometry, but use message `dir=auto` for mixed scripts.
- Implement Light/Dark/System and avoid pure-white/flat-black large backgrounds in the two default appearances. Verify text and popup contrast.
- Introduce shared semantic tokens for unrestricted Primary, Secondary, Tertiary, Background and Surface colors; make both shells consume the same source of truth. Allow arbitrary values, use editable presets as initial choices. Keep existing radius/shadow settings.
- **Acceptance:** AR/EN and RTL/LTR desktop/mobile smoke, mixed Arabic/English content, theme switching in both shells, mode-specific token persistence, contrast warning rather than silently clamping user color, no hard-coded white-only dialog/menu surfaces. Keep initial preferences local to UI v2; separate reviewed account sync later.

**B3 — Typography, chat proportions and first micro-interactions.**
- Evaluate (not pre-approve) Arabic/Latin typeface pairings on real content, including Arabic diacritics, emoji, numbers, and mixed direction. Improve line height, readable width, message clusters, bubble max widths, timestamps and spacing.
- Composer focus: subtle elevation and slightly increased scale/size, with proper focus-visible rings and no disruptive layout jumps. Send button: tactile press feedback and a very brief send acknowledgment. Introduce message-entry/reaction motion only for real features or honest UI previews.
- Keep native Message/Bubble/Scroller/InputGroup components; use CSS transforms/opacity for simple transitions.
- **Acceptance:** keyboard/touch, long text, IME/composition, scroll-to-end, reduced-motion, responsiveness and contrast.

**B4 — Chat-first sidebar and conversation identity.**
- Preserve shadcn `SidebarProvider`, `SidebarMenu`, mobile Sheet and collapse behavior. Adapt contents toward avatars, latest-message previews, times, unread badges and clear selected states, with color accents.
- Reduce work-dashboard navigation/noisy project lists. New chat affordance can be a small icon/context action when real chat creation is supported—**not** a large mandatory banner. Do not invent messages/presence/unread signals for production.
- **Acceptance:** keyboard and screen-reader navigation, functional actions, mobile and RTL mirror behavior, no wasted desktop width.

**B5 — Optional illustrated identity and backgrounds.**
- Create approved low-bandwidth wallpaper/pattern and empty-state assets. Make art optional and separate from readable DOM; test legibility across both modes and arbitrary user colors.
- Prefer small optimized assets, clean visual hierarchy and friendly moments over full-screen decorative noise.
- **Acceptance:** no art dependency for communication, reduced-data/fallback, safe contrasts, no forced illustration in user-selected plain modes.

**B6 — Cozy desktop, Phaser and floating-window refinement.**
- Ensure the room/world genuinely fills the full stage and stays visible behind Dockview windows. Improve warm window chrome, sensible initial positioning, drag/resize/touch/zoom behaviors and stage-vs-overlay hit testing. Respect mobile and keyboard fallbacks.
- Reuse the same chat components and theme tokens as Classic. One polished Forest Cabin first; other environments/visits are later—not new routes.
- **Acceptance:** desktop 16:9/16:10, portrait mobile, scene disabled/failure fallback, pointer and scroll correctness, modest-device performance measurements.

**B7 — Advanced Appearance and user-owned choices.**
- Native color picker + Hex (and optionally HSL) entry for **all roles**, including Background/Surface and chat wallpaper. Presets must be editable, not the only available choices.
- Add font choice, readable spacing/density, optional wallpapers and per-mode color editing. Keep user freedom with feedback for unreadable combinations; make reset easy.
- Store a versioned settings shape locally in prototype; cross-device Convex persistence needs identity/validation/isolation rules, explicit migration and its own reviewed PR. Import/export is **optional future work**, not a B7 requirement.
- **Acceptance:** independent Light/Dark palette, safe hydration/fallback, account isolation once enabled, no giant custom-style cascade.

**B8 — Motion and interaction polish, with staged adoption starting at B3.**
- CSS/Tailwind transitions and native shadcn/Radix behavior for simple states; evaluate **Motion for React** only if presence/layout transitions truly benefit, with lazy loading. Phaser Tweens for room objects; leave Dockview to handle actual dragging/docking.
- Message reactions, hover/press, selected chat transitions, sheets and optional Cozy ambient movement receive gentle, consistent timing. Consider **Off / Subtle / Playful** as a future user setting, not yet final UI behavior.
- `prefers-reduced-motion` takes priority. Avoid infinite attention-seeking motion, expensive width/height layout animation and overlapping Dockview/Sheet animations.
- **Acceptance:** touch and keyboard feedback, no scroll jitter/CLS, reduced-motion test, mobile energy/bandwidth profiling.

## Parallel tracks and integration gates

- **UI design track (this document):** iterate in isolated Draft UI PRs, owner reviews each batch; no broad styling patch pile-ups or premature production merge. B1 cleanup is implemented but not fully accepted.
- **Human messaging/security:** original [P0/P1 release gates](https://github.com/MohamedXIV/sengapp/issues/16) remain mandatory. Existing real messaging integration drafts have their own review path; a UI-only preview must never be described as a working production backend. Reuse real authorized messaging components in a separately reviewed integration after visual and security acceptance.
- **Cozy world:** [P1.5 integration and performance gates](https://github.com/MohamedXIV/sengapp/issues/21) remain; no mandatory GPU for basic chat. Progressive enhancement, performance and fallback are not optional.
- **AI companion:** [P3 and consent gates](https://github.com/MohamedXIV/sengapp/issues/8) remain independent; the UI-only owner alias and mock AI activity provide **no** permission or real AI access. PR #37 must be reviewed separately.
- **Not committed:** exact typeface pairing, Motion library inclusion, fine-grained animation intensity UX, specific artwork, account-level sync schema and import/export. Evaluate before implementation.

## Source of truth / maintenance

- **This document:** current UI v2 visual plan, owner decisions, sequence, acceptance criteria.
- [Overall roadmap](roadmap.md): product phases and dependency gates, with a short link here—not a duplicate checklist.
- [UI v2 implementation notes](ui-v2-figma-implementation.md): actual branch behavior, not design aspirations.
- [shadcn clean-room foundation](ui-v2-clean-room.md): historical baseline and original native component choices, not an instruction to restore stark stock-white visuals.
- Future UI changes should update the relevant batch status **and** record visual approval separately from automated checks. Avoid calling a mock permission or demo chat “production”.
