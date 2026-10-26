<p align="center">
  <img src="assets/brand/sengapp-mark.svg" alt="Sengapp squirrel-inspired chat mark" width="104" height="104">
</p>

<h1 align="center">Sengapp 🐿️</h1>

<p align="center"><strong>A little place for big conversations.</strong></p>
<p align="center">A cozy, invite-only messenger with personal expression, shared interests, and playful AI companions.</p>

<p align="center">
  <img alt="Project stage: planning" src="https://img.shields.io/badge/stage-planning-F59E0B?style=flat-square">
  <img alt="Platform: Progressive Web App" src="https://img.shields.io/badge/platform-PWA-2563EB?style=flat-square">
  <img alt="Stack: TypeScript" src="https://img.shields.io/badge/language-TypeScript-3178C6?style=flat-square">
  <img alt="Access: invite only" src="https://img.shields.io/badge/access-invite--only-10B981?style=flat-square">
</p>

> **Pre-alpha · No application build yet.** This repository currently contains product planning and project foundations. There is nothing to install or self-host.

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
- **Private circles, not a public social network.** Invite-only access, no global discovery or public communities in the near term.
- **Control over presence.** Online, last seen, read receipts and typing are on by default but independently disableable.
- **Companions need permission.** Every user owns their companion; joining a group requires approval and no companion volunteers the owner's private information.
- **Lightweight on mobile.** Chat text stays accessible HTML; animation is optional and respects reduced motion/data considerations.
- **Security is foundational.** Server-side membership checks, careful attachment access and transparent AI data processing are non-negotiable.

## Planned stack

**Next.js · TypeScript · Tailwind CSS · shadcn/ui · Convex · PixiJS · Zod · Zustand · AI SDK · Vitest · Playwright**

Convex-first is the agreed backend direction. We are not adding Supabase or SpacetimeDB by default. Specific integrations and release providers will be finalized as implementation begins.

## Project status

| Area | Status |
| --- | --- |
| Product direction and Convex-first choice | ✅ Agreed |
| v0.1 design specification | ✅ Approved (2026-10-26) |
| Repository foundations | 🚧 In progress |
| App code and deployment | ⏳ Not started |
| Private family/friends alpha | ⏳ Planned |

Start with the [product vision](docs/product/vision.md), [phased roadmap](docs/product/roadmap.md), [architecture overview](docs/architecture/overview.md), and [approved v0.1 design](docs/specs/sengapp-v0.1-design.md).

## Get involved

We welcome thoughtful feedback on the vision and documentation. For bugs, feature proposals, or contributions, see [CONTRIBUTING.md](CONTRIBUTING.md) and the issue templates. Please keep new features out of the frozen v0.1 scope unless they replace existing work.

**Licensing:** The repository is public, but a software license has **not** yet been selected. Public visibility alone does not grant redistribution or modification rights. Please wait for an explicit LICENSE file before assuming open-source reuse permissions.

**Security:** Please **do not** publish vulnerabilities as public issues. See [SECURITY.md](SECURITY.md).

---

<p align="center"><sub>Built for small circles, big conversations, and perhaps one mischievous squirrel. 🐿️</sub></p>
