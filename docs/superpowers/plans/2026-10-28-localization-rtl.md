# Sengapp localization and right-to-left implementation

## Goal

Use `next-intl` for English and Arabic, take the supported shadcn/ui RTL
migration path, and keep language preferences per authenticated profile.
The private app deliberately keeps its existing, non-locale-prefixed URLs.

## Implemented approach

1. Resolve a visitor's initial language from `Accept-Language`; English is the
   fallback. At verified first sign-in, seed the account locale from the
   browser. Existing account preferences always win and are never overwritten.
2. Provide mirrored English/Arabic catalogs through `next-intl` for public
   entry points, member navigation, invitation flows, profile, appearance,
   and administration.
3. Use the official `shadcn` RTL migration, `DirectionProvider`, logical CSS
   spacing, and the prescribed manual Sidebar side/Sheet corrections.
4. Synchronize `html[lang]` and `html[dir]` with account changes. Keep the
   explicit text-direction preference separate for user-authored fields.
5. Localize Clerk's public authentication UI and human-readable dates.
6. Verify translation-key parity, language precedence, profile isolation,
   direction switching, invitation behavior, lint, and TypeScript checks.

## Follow-up before private alpha

- Human browser acceptance in desktop and narrow/mobile viewports in both
  languages (including dialogs, selects, auth screens and Sidebar).
- Recheck longer text and font fallback with native Arabic readers.
- Translations currently cover existing user-facing surfaces, not future
  chat, media, or AI features that have not yet been implemented.
