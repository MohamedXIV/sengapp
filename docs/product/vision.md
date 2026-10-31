# Sengapp — Product Vision

**Status:** Core messaging v0.1 direction approved 2026-10-26; **Cozy World + Floating Workspace direction accepted 2026-10-31**. See [the current direction](cozy-world-workspace-direction.md).

## One sentence

A cozy private-circle messenger set in a personal, customizable 2D isometric world, with accessible floating chat and personal tools; optional animated/AI companions may enrich it later.

## Why build it?

Accounts use verified open signup; private social connections are established by consent and one-use invitations. The first users are friends and family who dislike the crowding, group noise and social pressure of major messaging platforms. Sengapp is a deliberate small-space alternative, **not** a WhatsApp replacement.

## The personality

**A living, cozy workspace — without sacrificing a reliable messenger.** The proposed signature experience is a full-viewport, customizable 2D isometric world with floating, rounded, touch-friendly panels. Chat remains accessible without graphics. The interface still welcomes personal fonts/colors, statuses and small, nostalgic interactions inspired by MSN/Yahoo. See [Cozy World & Workspace](cozy-world-workspace-direction.md).

## What makes it distinct over time?

1. **Human conversations are the center.** Private DMs/groups must be useful without AI.
2. **Every member can have a named companion.** Agents help their owners in a private space, can be summoned where authorized, and have visible, optionally animated mascots.
3. **Conversations accumulate shared interests.** Game/film/music recommendations can eventually become living cards and per-group collections, not lost links.
4. **People can experience media together.** Synced watch/listen sessions and timestamped reactions belong on the roadmap, not the first release.

## Product commitments

- Open verified signup, consent-based one-use private connection invites, and private conversations/groups. No stranger discovery, public feed or public communities in the foreseeable roadmap.
- Presence/last seen/read receipts/typing are default-on but individually configurable.
- A companion never joins a group automatically with its owner; an explicit approval path is required.
- A companion must not reveal private owner information on its own. Provider context and external integrations are opt-in and least-privilege.
- Avoid wasteful mobile bandwidth, intrusive notifications and decorative animation that impairs reading. The Phaser world is progressive enhancement: no GPU dependency for sending a message.
- Public source code and official hosting initially; self-hosting is not a supported release target yet.

## Release intent

First a private family-and-friends alpha, then potentially a wider **invite-only** public alpha after security, privacy, reliability and operating costs have been tested with real use.

For scope and specific constraints, see the [approved v0.1 design](../specs/sengapp-v0.1-design.md).
