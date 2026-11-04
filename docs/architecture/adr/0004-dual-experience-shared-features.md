# ADR 0004 — Two experiences, one Sengapp (1 November 2026)

**Decision:** Classic and Cozy World are permanent first-class presentation shells
for the same private messenger, not separate apps or duplicate features.
All Clerk identity, Convex conversations, groups, connection permissions, profile
updates and account settings stay canonical and shared.

## Routes and device choice
- `/` is the Cozy World route; `/classic` is the lightweight traditional home.
  Classic conversation, people and account screens remain `/chats`,
  `/chats/[conversationId]`, `/connections` and `/settings/*`.
  Room design never changes the route. Existing `/home` and
  `/lab/cottage` compatibility redirects remain.
- Choosing the mode writes a non-sensitive, one-year SameSite=Lax cookie on this
  device. A plain visit to `/` redirects to `/classic` on the server when
  Classic is selected. Explicit `/?panel=...` deep links open Cozy regardless
  of the preference. With no cookie, default is Cozy.
- The switch uses a full navigation so the server sees the new cookie and
  Classic never eagerly hydrates the Phaser/Dockview scene. The preference is
  intentionally per-device: a low-bandwidth phone can stay Classic while a
  desktop stays Cozy. This is not an account mutation or security control.
- Switching between matching feature surfaces preserves Chats, conversation
  IDs, Connections, Profile and Appearance where possible. Notes, focus and
  room editing are currently Cozy-only tools; switching from these returns to
  Classic home. Switching does not automatically save unsent chat drafts.

## Single feature implementation
- Classic pages **must not import Phaser, Dockview, RoomCanvas or room assets**.
  Cozy imports them only in its shell. Both shells render the same secure React
  features, not separate read/write flows.
- `ChatsContent`, `ConversationsList`, `DirectThread`,
  `ConnectionsSpace`, `ProfileEditor` and `AppearanceEditor`
  are shared implementation points. The `embedded`/compact flags change
  layout and navigation only. Auth and membership enforcement remain inside
  the shared Clerk/Convex path.
- Production release still depends on parent-first Draft PR review, live
  two-account invitation/group testing, RTL, mobile keyboard and physical
  low-end Android profiling. No automatic Production merge.
