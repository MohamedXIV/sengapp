# Sengapp — Cozy & Playful shell

**Approved direction:** A — Cozy & Playful, 28 October 2026. The illustrated concept is a mood reference, not a pixel-perfect specification.

## Goal

Make the current Phase 0 app feel like a small, welcoming place: calm, softly rounded, personable, visually distinct, and usable in Arabic RTL and English LTR on a phone or desktop.

## Design contract

- Start with existing shadcn/ui primitives. Apply the `sidebar-04` floating variant pattern to the existing Sidebar rather than overwriting it with a generated template.
- Keep desktop navigation on the physical **right in Arabic**, **left in English**; mobile Sheet opens on that same physical side. Sidebar toggle, links, and focus states must work with both directions.
- Use a warm ivory/coral/amber Acorn default, tactile layered surfaces, accessible text contrast, generous spacing, a restrained brand illustration, and subtle decorative accents. No mandatory animation or expensive image download.
- Preserve all user-selected presets, accents, fonts, corners, density, light/dark modes, and cross-account isolation. Decoration must take its colors from semantic theme tokens and must not force a fixed light appearance.
- Home must be a friendly **honest** empty state: invitation and profile actions are real; never fake chats, users, messages or AI companion behaviors that Phase 0 cannot perform.
- Connections, invite creation and Profile/Appearance should feel like the same product. Preserve invite creation/copy/share/revoke, single-use state and private contact visibility.
- Arabic should feel human and friendly, not bureaucratic or region-specific slang. Keep short natural English copy with the same meaning. No bidi confusion for handles, emails, links or mixed-script labels.
- Mobile touch targets, keyboard focus, reduced motion, and navigation semantics remain intact.

## Scope boundaries

This is a Phase 0 **UI pass** within draft PR #10. No new database schemas, account rules, fake messaging screens, AI models, paid delivery, or changes to Production. Chat experience is designed later when its backend exists.

## Acceptance

1. RTL and LTR desktop nav and mobile Sheet use the intended physical edges; current route shows an active state and navigation remains accessible.
2. Warm, visually coherent shell/Home/Connections/Settings, with original small mascot mark and restrained decorative motifs.
3. Existing personalized theme system remains effective; dark mode and forest/dusk/ocean still work.
4. Invite issuance/consumption UI retains all existing behaviors and tests.
5. Test suite, lint, typecheck and build pass locally; PR remains draft for owner's visual review.
