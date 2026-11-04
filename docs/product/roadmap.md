# Sengapp — Roadmap

> **Sequence, not dates.** These are product stages, not promises or deadlines. Core v0.1 spec approved 2026-10-26; the optional Cozy World + Floating Workspace direction was added 2026-10-31 in [the updated direction](cozy-world-workspace-direction.md). Live Draft PRs remain unmerged.

## v0.1 — Build a messenger people trust

### 0. Foundations

- Implement the approved privacy defaults; select a license before accepting external contributions.
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

### 2.5. Cozy World + floating workspace (experimental integration, after P0/P1 gate)

- [x] Prove a small, independent Phaser 4 world with modular isometric room sprites and full-stage 16:10 coordinates in Draft PR #20.
- [x] Prototype Dockview floating/dockable windows and mobile drag/resize equivalents; local layout and furniture state.
- [ ] Resolve production dependency advisories and measure real modest-phone performance, memory, bandwidth, gestures and reduced motion.
- [ ] Wire **real authorized** DMs/groups into floating panels without exposing messages to Phaser or weakening Convex guards; offer direct chat fallback.
- [ ] Produce one polished Forest Cabin with room+outdoor world art; verify soft-grid furniture placement and asset pipeline.
- [ ] Decide which room data may sync via Convex vs per-device window layouts, with explicit ownership/privacy rules.
- [ ] Accessibility/RTL/LTR/keyboard/theme review and owner sign-off before promoting the Draft prototype into the production chat chain.

**Scope policy:** This does not silently add an AI agent, pet gameplay, visits, economy or world multiplayer to v0.1. Defer other optional cosmetics if needed. Exact implementation order and independent PR bases are maintained in the [direction](cozy-world-workspace-direction.md).

### 3. Sengapp personality

- Custom profile status and safe message font/color options.
- Optional visual companion layered over Phaser/React windows, with reduced-motion controls and pointer-safe behavior; rendering technology remains provisional. No AI access implied by visual animations.
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
