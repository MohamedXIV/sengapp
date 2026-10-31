<p align="center">
  <img src="assets/brand/sengapp-mark.svg" alt="Sengapp squirrel-inspired chat mark" width="104" height="104">
</p>

<h1 align="center">Sengapp 🐿️</h1>

<p align="center"><strong>A little place for big conversations.</strong></p>
<p align="center">A cozy private-circle messenger in development: open accounts, connections by consent, and playful AI companions planned for later.</p>

<p align="center">
  <img alt="Project stage: planning" src="https://img.shields.io/badge/stage-foundation--in--review-F59E0B?style=flat-square">
  <img alt="Platform: Progressive Web App" src="https://img.shields.io/badge/platform-PWA-2563EB?style=flat-square">
  <img alt="Stack: TypeScript" src="https://img.shields.io/badge/language-TypeScript-3178C6?style=flat-square">
  <img alt="Access: open verified signup" src="https://img.shields.io/badge/access-open--verified--signup-10B981?style=flat-square">
</p>

> **Pre-alpha · Phase 0 foundation.** A Next.js app shell, verified open signup, and private connection invitations are under review on isolated Preview. This is **not** yet a working messenger, AI companion, or Production/hosted alpha.

## Why Sengapp?

Mainstream messengers already do almost everything. Sengapp isn't trying to out-feature them. It's for a quieter circle of friends and family: a place where chatting feels comfortable, sharing interests stays organized, and everyone's digital companion has a bit of personality.

**Modern by default. Playful by choice.** Think thoughtful messaging with a dash of the personal fonts, custom statuses and gentle silliness people remember from the Yahoo Messenger/MSN days—not a retro UI clone.

## The idea

| 💬 Real conversations | 🐾 Living companions | 🎨 Your personality |
| --- | --- | --- |
| Private DMs and groups, media, replies, reactions and familiar presence controls. | Named, animated AI buddies in private spaces and explicitly approved group conversations. | Optional per-user fonts/colors, statuses and accessible themes. |

**Later, once chat is solid:** living recommendation cards, shared collections that remember the games/films/music you discussed, and synchronized watching/listening with timestamped comments.

## Product principles

- **People first.** Reliable human messaging must work even when AI providers are unavailable.
- **Private circles, not a public social network.** Anyone can create a verified profile; people connect only through consent. No global directory or public communities.
- **Control over presence.** Online, last seen, read receipts and typing are on by default but independently disableable.
- **Companions need permission.** Every user owns their companion; joining a group requires approval and no companion volunteers the owner's private information.
- **Lightweight on mobile.** Chat text stays accessible HTML; animation is optional and respects reduced motion/data considerations.
- **Security is foundational.** Server-side membership checks, careful attachment access and transparent AI data processing are non-negotiable.

## Stack direction

**Current foundation:** Next.js 16.4 · React 19.3 · TypeScript 6 · Tailwind CSS 4.3 · shadcn/ui · Clerk · Convex · Zod · Vitest · Playwright.

**New optional visual direction (in Draft PR #20):** Phaser 4 full-viewport 2D personal world + Dockview floating React workspace, with a smaller modular isometric room inside a wider 16:10 landscape. Later: cross-window visual companions and permissioned AI. **This is a Prototype, not Production.** Read [the approved direction](docs/product/cozy-world-workspace-direction.md) and [ADR 0002](docs/architecture/adr/0002-personal-world-and-workspace.md).

Convex-first is the agreed backend direction. We are not adding Supabase or SpacetimeDB by default. Specific integrations and release providers will be finalized as implementation begins.

## The evolving Cozy World experience

The owner accepted a new creative direction on 2026-10-31: a private personal 2D world, real messaging in floating/resizable/dockable React windows, and a fallback direct chat when graphics are disabled or unavailable. The Phaser world fills the screen and has world coordinates independent of the small forest cottage, leaving room for later outdoor scenery and optional themes. The [playable Draft Preview](https://sengapp-git-experiment-cozy-room-workspace-mxiv.vercel.app/lab/cottage) is a sketch with **local-only** Notes, timer and furniture; it does **not** yet embed authenticated chat or an AI companion. The older v0.1 spec remains the authority on chat privacy/security.

## Project status

| Area | Status |
| --- | --- |
| Product direction and Convex-first choice | ✅ Agreed |
| v0.1 design specification | ✅ Approved (2026-10-26) |
| Repository foundations | ✅ Established |
| Phase 0 app shell, sign-in and invitations | 🚧 Under review |
| Modern shadcn interface & per-account themes | 🚧 In draft PR #10 |
| Live OAuth smoke and deployment | 🚧 Partial Preview smoke only |
| Private family/friends alpha | ⏳ Planned |

To set up or test the code, read [local development](docs/development.md) and the [Phase 0 acceptance ledger](docs/testing/phase0-acceptance.md). No production credentials or real users are included.

Start with the [product vision](docs/product/vision.md), [phased roadmap](docs/product/roadmap.md), [architecture overview](docs/architecture/overview.md), and [approved v0.1 design](docs/specs/sengapp-v0.1-design.md).

## Get involved

We welcome thoughtful feedback on the vision and documentation. For bugs, feature proposals, or contributions, see [CONTRIBUTING.md](CONTRIBUTING.md) and the issue templates. Please keep new features out of the frozen v0.1 scope unless they replace existing work.

**Licensing:** The repository is public, but a software license has **not** yet been selected. Public visibility alone does not grant redistribution or modification rights. Please wait for an explicit LICENSE file before assuming open-source reuse permissions.

**Security:** Please **do not** publish vulnerabilities as public issues. See [SECURITY.md](SECURITY.md).

---

<p align="center"><sub>Built for small circles, big conversations, and perhaps one mischievous squirrel. 🐿️</sub></p>
