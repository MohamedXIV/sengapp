# Sengapp — v0.1 Product & Technical Design

**Status:** Approved by the project owner on 2026-10-26  
**Date:** 2026-10-26  
**Project:** Sengapp (working name; trademark/domain availability not verified)

> **Historical baseline / amendments:** This document records the 2026-10-26 original v0.1 design. On 2026-10-31, the owner adopted the [Cozy World + Floating Workspace direction](../product/cozy-world-workspace-direction.md) and [ADR 0002](../architecture/adr/0002-personal-world-and-workspace.md). Those documents supersede this specification **only for the visual shell, 2D renderer, floating panel strategy and future mascot rendering choice**. They do **not** loosen messaging authorization, group consent, privacy, security or release scope. Also note the live P0 decision is **open verified Clerk signup with invitation-only private connections**, not invite-only account registration. Preserve this older spec as a historical design record.

## 1. Intent

Sengapp is a **mobile-first, invite-only social messenger** for a small circle of family and friends. It should be a comfortable place to talk, share interests and spend time together without the noise of large mainstream messaging networks. It is **not** intended to replace WhatsApp or compete on feature count.

Its identity is **Modern Messaging + Personal Expression + AI Companions + a Touch of Nostalgia**. The design rule is **modern by default, playful by choice**, inspired in small ways by Yahoo Messenger and MSN rather than recreating their interfaces.

The source repository will be public/open source. Initially, only the official hosted service is supported; user-run deployments and a public social network are not part of the near-term product.

## 2. Goals, Boundaries and Success

### Goals

- A dependable, polished, genuinely usable direct-message and small-group chat experience on phones and desktop browsers.
- Personal identity via optional per-user fonts/colors, profile statuses, and a named AI companion with a visible animated avatar.
- Privacy controls that respect people without removing familiar social indicators.
- A safe baseline for a future invite-only public alpha, while remaining affordable for a small group.
- An extensible foundation for living recommendations, collections and watch/listen-together experiences after the chat foundation works.

### Non-goals for v0.1

- Replacing WhatsApp; matching every feature of WhatsApp, Telegram or Discord.
- Public feed, public communities, random matchmaking, global search for strangers, or public creator content.
- End-to-end encryption; document clearly that the server can technically access message content and that opted-in AI calls send selected context to an external provider.
- Community self-hosting support, federation, payments, subscriptions, or advertising.
- Full-autonomy AI agents, arbitrary external tool execution, advanced agent-to-agent social behavior.
- Watch/listen synchronization, timestamp comments, full living recommendation cards, automatic shared libraries, elaborate Winks/Nudges, advanced mascot physical interaction with message text.

### Anti-goals

- A noisy, notification-heavy UX that recreates the user's frustration with WhatsApp groups.
- Feature creep before core message delivery is stable.
- Hidden AI access to other people's chats, personal memories or external accounts.
- Heavy, always-on rendering that drains mobile data, battery or accessibility comfort.

### Private-alpha success conditions

An invited friend can register, accept another person's chat/group invitation, exchange text/images/short voice notes, reconnect without losing message state, control privacy indicators, and mention a permitted AI companion. The app behaves sensibly on a modest Android phone over variable connectivity. Different users cannot read each other's private data or attachments by changing IDs.

## 3. Confirmed Product Decisions

| Area | Decision |
| --- | --- |
| Product | Sengapp, private social messenger with AI companions |
| Access | Invite-only people and private conversations/groups; possible broader invite-only alpha later |
| Code | Public/open-source repo; official hosted service only initially |
| UI | Mobile-first responsive PWA; modern by default, playful by choice; dark and light modes |
| Familiar signals | Online status, last seen, read receipts, typing indicators enabled by default; individually controllable |
| Agents | Each user has a private companion with name/personality/visual identity; private chat and explicit mentions |
| Group agents | Must be invited/approved as participants; not automatically added with owners |
| Proactivity | Owner-controlled; mention-only mode always available; richer initiative in a later phase |
| Data isolation | Agent may never volunteer its owner's private information to others without explicit owner permission |
| Nostalgia | Optional personal message font/color and custom status early; nudges, winks, custom emoticons later |
| Later social | Structured recommendations and per-group shared collections; watch/listen parties and timed comments |

**Scope freeze:** no additional v0.1 features without an explicit trade-off (a feature is deferred or removed to pay for a new one). Defects, accessibility, privacy and security fixes are not scope creep.

## 4. v0.1 User Experience

### 4.1 Access and identity

- Invite-based signup; invites are single-use or explicitly limited-use, revocable and expire.
- Basic profile: name/handle, avatar, custom short status, optional personal message font and color.
- User can manage contacts, accept/reject chat/group invitations, leave groups and block unwanted contacts.
- No address book upload by default; no discoverability outside shared invitations/relationships.

### 4.1a Approved v0.1 privacy rules

The project owner explicitly approved these four rules on 2026-10-26:

1. **Group history:** a joining member receives messages from their join point onward (no automatic historic disclosure). Removal/leave immediately revokes future server reads, file access and notifications; previously downloaded content cannot be retroactively erased from another person's device.
2. **Invitations and authority:** an initial operator/admin issues signup invites; later existing members may receive a small, revocable invite allowance. Group creator is admin and can designate other admins; admins manage group membership, group invitations and companion approvals. Server enforces all roles.
3. **Group AI consent/context:** all current group members must be told and agree before AI companion participation is enabled. An authorized @mention sends only the mentioning message and explicitly referenced/replied-to content, **not** an automatic preceding chat history window. No owner-private memories/tools are shared.
4. **Group acquaintances/blocking:** group members can see each other's group display profile, but DMs use an accept/reject request. Blocking prevents private requests and direct invocation/notifications; a shared group still exposes group messages unless moderation/removal occurs. The UI explains this limit.

Changing these defaults later requires reviewing data model, authorization and user-facing privacy expectations.

### 4.2 Messaging essentials

- One-to-one DMs and private group chats.
- Realtime text messages, timestamps, message ordering, pagination/history, retries for transient failures.
- Images, modest-size file attachments and short recorded voice messages; uploads have visible progress/failure feedback.
- Reply to message, edit/delete one's messages, emoji reactions, and basic conversation/message search scoped to authorized membership.
- Online/last-seen, read receipts and typing; each individual indicator is default-on and independently disableable. The UI must not expose suppressed indicators through side channels.
- Web push notifications where supported and permission is granted; in-app indicators everywhere. Respect mute/quiet preferences; push is best-effort, not guaranteed on every browser install.
- PWA install path; responsive desktop and mobile layouts. A cached application shell is helpful but full offline messaging/guaranteed outbox synchronization is not promised in v0.1.

### 4.3 Personal expression and aesthetics

- Default typography is neutral, legible and fast. A curated, small font set and validated colors provide sender-specific styling for text messages.
- Recipient can override other users' fonts/colors globally for accessibility/readability.
- Light/dark mode; reduced-motion and optional hide/disable mascot animations; chat text stays selectable and accessible DOM, not Pixi-rendered.
- Nostalgia remains a set of recognizable details rather than a retro skin by default.

### 4.4 AI companion vertical slice

- User picks or receives a companion with a name, simple personality, avatar, and animated idle/reaction states.
- A private companion conversation/space supports prompts and lightweight personal assistance.
- Companions respond when explicitly mentioned inside a conversation **only if authorized to participate in that conversation**. Group owner/admin invitation or appropriate group approval is required first.
- Companions do not automatically read all group messages or all owner chats. Only the authorized invocation and minimum necessary explicitly selected context go to the provider.
- A server-side provider adapter supports a low-cost, quota-limited default and possible future account-linked or BYOK modes, subject to actual provider eligibility. Never assume a ChatGPT subscription equals unrestricted API credits.
- Rate and token budgets per user, safe failure messages, user-visible AI participation labeling, and no covert provider switching to a less-private model.
- **Proactive mode** is a roadmap capability. Design preferences to support `mention-only` and a later `social` mode; v0.1 need only ship reliable mention-driven interaction, without surprising unsolicited messages.
- PixiJS is a transparent, optional visual layer above/beside accessible React/DOM UI, with pointer events restricted to interactive pets; visual tricks must not alter actual message contents.

## 5. Implementation Approach — Chosen

Three viable backend approaches were considered:

| Approach | Why it was considered | Trade-off | Decision |
| --- | --- | --- | --- |
| Convex-first | Built-in reactive queries and subscriptions; straightforward small-team chat development | Platform coupling and explicit attention to file access rules | **Chosen** |
| Supabase-first | PostgreSQL, Auth, Storage and customizable Realtime | Additional realtime authorization/event plumbing for this UX | Not in v0.1 |
| SpacetimeDB-first | Realtime-oriented subscriptions and server logic | Higher adoption/operational uncertainty for a conventional small chat app | Not in v0.1 |

**Stack:** Next.js (App Router), TypeScript, Shadcn/ui, Tailwind CSS, Convex, PixiJS / `@pixi/react` when appropriate, Zod, Zustand only for transient UI state, Vercel AI SDK provider abstraction, Vitest and Playwright. Use a reputable Auth solution officially supported with Convex; select and pin its actual integration before implementation. Use Convex for application data and realtime. Do **not** introduce a second database by default. Keep file storage behind a small application-owned interface.

### Architecture boundaries

- **Browser/Next.js:** UI, routing, PWA, accessible message DOM, upload UX, local animation state and Pixi canvas.
- **Convex:** persistent users/profiles/invites/conversations/memberships/messages/reactions/settings/attachments/agent data; subscriptions; server-side membership checks in *every relevant function*.
- **Ephemeral activity:** lightweight, rate-limited typing/presence signals with TTL/last-seen fallbacks, not an unbounded message history of heartbeat writes.
- **AI server actions:** server-held provider credentials, constrained per-companion instructions, explicit context assembly, validated tool intents, budgeting and logs without storing unnecessary private prompt content.
- **Storage:** upload intent and metadata authorized to chat members; restrict allowed types/sizes and ensure download access is designed for changing group memberships.
- **Notifications:** permission-based web push plus in-app notification state; do not place message text into notification payloads by default without a user privacy choice.

### Conceptual entities

`User`, `Profile`, `Invite`, `ContactRelationship`, `Conversation`, `ConversationMember`, `Message`, `MessageReaction`, `Attachment`, `UserPrivacySettings`, `ReadPosition`, `PresenceLease`, `NotificationSubscription`, `Companion`, `CompanionConversationPermission`, `AgentInvocation`, `AgentPreference`, `AIUsageBudget`.

Reference relationships: members belong to conversations; every message and attachment references a conversation and author; read positions are per-user/per-conversation; a companion is owned by exactly one user and only participates in explicitly approved conversations. No rank or public social graph exists.

## 6. Security and Privacy Baseline

**Open-source code does not imply open user data.** Hosted deployments remain invite-only and authenticated.

- TLS, secure session/cookie handling, passwordless/OAuth as selected through the supported Auth integration; server-managed secrets never shipped to browsers or Git.
- Every query, mutation, action, upload and subscription must enforce identity plus conversation/group membership or ownership. Client-side hiding is never authorization.
- Invite creation, acceptance and revocation enforced server-side, with expiry, redemption bounds and abuse throttling.
- Validate request shapes and content; enforce size/type limits; sanitize user-visible rich content; avoid arbitrary HTML rendering.
- Prevent durable public attachment URLs from silently bypassing current chat membership. Convex generated file URLs are bearer links; use authorized streaming/proxy or an approved short-lived-download-URL solution before sensitive media goes live.
- AI context is scoped, minimized, authorized and disclosed. Private memories, calendar/Drive/GitHub access and tool actions require separate opt-in permissions; no delegated access in v0.1.
- Rate limits and basic anti-abuse for sends, uploads, invites and AI requests. User-level provider budgets and kill switches protect free-tier costs.
- Secret scanning and dependency advisories for the public repo; secure-by-default environment documentation. Avoid optional paid GitHub Actions jobs when local checks suffice.
- Explicit privacy notice: no E2EE in v0.1, backend and authorized AI vendors process selected content. User-controlled retention/deletion policy must be specified before outside-family alpha.
- Regression tests for horizontal data leakage: stranger cannot query conversation, list messages, download attachments, add agents, or invoke privileged AI tools by altering an ID.

## 7. Delivery Boundaries (Not Deadlines)

1. **Foundation:** repository, design system, auth, invites, data schema, access-control fixtures, error handling and responsive shell.
2. **Reliable chat:** DMs/groups, core messages/reactions/replies, delivery retry, pagination, privacy preferences, typing/presence/read, search.
3. **Media and installability:** gated image/file/voice uploads, storage safeguards, PWA install, push where available, mobile data/performance checks.
4. **Sengapp personality:** profile status, sender font/color + viewer override, simple Pixi companion layer, private companion conversation, group invitation and @mention vertical slice, usage limits.
5. **Private alpha hardening:** invited family/friend test, browser/mobile smoke tests, authorization tests, accessibility, observability, quotas, backups and release documentation.
6. **Later social milestones:** living recommendation cards, shared collections, synced media rooms, timestamp comments, richer agents and integrations; plan each separately rather than silently pulling into v0.1.

**Release gate:** do not declare alpha ready until two independent accounts can exercise the complete invite-to-chat flow; cross-user authorization attacks fail in tests; media access is not inadvertently public; a model outage does not break human messaging; notifications can be muted; and basic mobile PWA install/performance and recovery are verified.

## 8. Builder Discretion / Explicitly Unresolved

These are design or operational details to resolve during the implementation plan, not permission to expand scope:

- Exact authentication adapter, push plumbing, file-size thresholds, media delivery strategy, mascot asset pipeline, font list and visual tokens.
- Deploy provider and domain, storage quotas/free-tier caps, rollout environments, test-device/browser matrix and minimum observability.
- Which AI model/provider is eligible, affordable and privacy-appropriate at rollout; no assumption that a specific free tier will remain available.
- Open-source license choice, repository name/organization, and trademark/domain availability before public publication.
- Data retention/export/deletion operational policy before inviting people outside the initial trusted circle.

**Implementation rule:** prefer the smallest coherent solution; organize by features/services without monolithic files or gratuitous tiny modules. No second backend, heavy 3D system or elaborate infra unless a demonstrated product need justifies it.

## 9. Approval Boundary

The owner approved the **product shape, v0.1 scope, architecture direction and guardrails** on 2026-10-26. This approval does not itself authorize provisioning paid services, deploying the product, using provider credentials or inviting real users. The first dependency-ordered implementation plan is in `docs/superpowers/plans/2026-10-26-sengapp-phase0-foundation.md`.
