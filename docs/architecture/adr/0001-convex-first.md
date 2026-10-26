# ADR 0001 — Choose Convex-first

**Date:** 2026-10-26  
**Status:** Accepted  
**Context:** Sengapp is a small, mobile-first, invite-only messenger that needs reactive chat state and safe permissions. Cost and low operational complexity matter.

## Options considered

| Option | Strength | Cost/trade-off |
| --- | --- | --- |
| Convex | Reactive subscriptions and an integrated application backend | More vendor coupling; sensitive file URLs need deliberate handling |
| Supabase | Postgres, storage and realtime with SQL/RLS control | More application-specific realtime/event plumbing |
| SpacetimeDB | Interesting realtime-first execution and subscriptions | More adoption/operational uncertainty for this first messenger |

## Decision

Use **Convex as the one application backend**. Do not combine it with Supabase or SpacetimeDB in v0.1. Continue using Next.js, TypeScript and the agreed client-side stack.

## Consequences and mitigations

- Implement all authorization centrally in server operations and test cross-user access.
- Model membership and its transitions explicitly.
- Use an attachment abstraction so membership-safe download can be changed without rewriting chat.
- Choose authentication integration, provider, quotas and hosting during the implementation plan.
- Reassess storage or architecture only against measured needs, not curiosity.

This records a direction, not a commitment to paid plans or provider lock-in forever.
