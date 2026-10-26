# Sengapp — Roadmap

> **Sequence, not dates.** These are product stages, not promises or deadlines. The v0.1 specification is pending owner sign-off.

## v0.1 — Build a messenger people trust

### 0. Foundations

- Confirm the design draft's remaining privacy defaults and select a license.
- Bootstrap Next.js, TypeScript, shadcn/ui, Tailwind and Convex.
- Authentication, invitation flow, server-side membership guards and responsive app shell.
- Basic testing and documented environments.

### 1. Human messaging

- DMs and private group conversations.
- Text messages, history, replies, reactions, edit/delete and search.
- Typing, presence, last seen, read receipts and user controls.
- Mute settings and resilient reconnection.

### 2. Media and PWA

- Images, limited-size files and voice messages.
- Authorized file delivery, upload progress and basic media preview.
- Installability, notifications where supported and accessibility/performance checks.

### 3. Sengapp personality

- Custom profile status and safe message font/color options.
- A lightweight PixiJS mascot layer with reduced-motion controls.
- Private AI companion space and authorized, mention-driven group participation.
- AI provider quotas, privacy boundaries and graceful failure.

### 4. Private alpha readiness

- Multi-account security regression tests.
- Family/friends usability and mobile browser testing.
- Backups, operational logging without unnecessary message capture, quotas and a clear privacy notice.

## After v0.1 — Shared interests and experiences

- **Living Recommendations:** game/movie/music/link cards with statuses and opinions.
- **Shared Collections:** per-group organized history of recommendations.
- **Watch/Listen Together:** synchronized playback for supported content and timestamped comments.
- **Companion growth:** controlled proactivity, richer animations and explicit-permission integrations.
- Optional nostalgics: nudge/buzz, custom emoticons, themes and winks.

## Explicitly out of scope

Public social feeds, global discoverability, self-hosting support, E2EE for initial alpha, monetization, and autonomous agents with unrestricted third-party access.

When considering a new v0.1 feature, identify what current v0.1 item is deferred to pay for it.
