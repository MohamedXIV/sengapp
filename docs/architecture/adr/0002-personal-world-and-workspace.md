# ADR 0002 — Private 2D World and Floating Messaging Workspace

**Date:** 2026-10-31  
**Status:** Accepted product direction; technical adoption pending acceptance of Draft PR #20 and release gates.

## Context

The early product UI felt like a generic promotional/dashboard interface despite a deliberately intimate messenger concept. The owner explored original visual sketches, then approved a personal, customizable isometric **2D world** supporting floating messages and productivity panels. A full 3D asset pipeline was judged too costly for the range of rooms and furniture desired.

An interactive technical spike is already deployed separately. Existing archived v0.1 documentation assumes a conventional shadcn UI with a *PixiJS mascot layer*. That is now incomplete.

## Decision

- Keep **Next.js/React/shadcn/Convex/Clerk** as the message, identity and accessibility stack.
- Use **Phaser 4** as the current 2D world engine candidate; keep scene/game runtime modular and independent from chat correctness, routing and auth.
- Use **Dockview React** for experimental desktop floating/docking panels; phone has its own touch-first window behavior, not desktop docking forced into a small screen.
- Canvas fills actual viewport; landscape **world coordinates** (initially 1600×1000 / 16:10) do not equal viewport or room bounds. The current cottage is a smaller object inside that world. Pan, pinch, zoom, Fit World and Fit Room operate on world coordinates.
- Author modular 2D isometric sprites. Start with static shell, depth-sorted furniture and optional atmosphere; don't overengineer render layers.
- Keep window content as **accessible HTML**, source-of-truth via server-side membership checks. Rendering may fail/disable independently.
- Split *visual companion* (optional, later traverses React windows via an overlay) from *AI companion* (permissioned, later); do not silently combine access to messages.
- Persist desktop/mobile window geometry locally by device first. User-owned room data may sync through Convex **after** a schema and access design is reviewed.

## Alternatives considered

- **Three.js / 3D rooms:** greater camera and furniture rotation freedom, but considerably higher art-production and maintenance costs for many themes; not selected for initial slice.
- **PixiJS 8:** capable custom shaders, rendering and sprites; would require more home-grown scene input/lighting for this particular prototype. Keep a same-asset comparison open if Phaser is unacceptably costly on mobile.
- **Conventional messenger with mascot only:** safe/simple, but doesn't provide the wanted lived-in personal space. It remains a necessary **low-power/failure fallback**, not the flagship creative mode.
- **Custom desktop window manager:** avoid until Dockview is benchmarked and actual missing features are identified.

## Consequences / risks

Better differentiating product identity and extensible art packs. Additional runtime bytes, WebGL support concerns, mobile thermals/battery and input complexity. Potential pointer conflicts between dragging furniture, panning the world and moving windows. Need real group/DM integration without touching server permissions. Future overlay companions must track camera/window transforms and never intercept typing.

## Acceptance to promote from experiment

1. Exact-head CI, responsive Playwright, keyboard/RTL/light-dark/reduced-motion checks.
2. Actual modest-phone memory/FPS/download/gesture measurements, preferably at 16:10 and common 16:9 and portrait viewports; no universal performance promises.
3. True authenticated conversation panel and direct-chat fallback; no fake preview/chat content.
4. Dependency advisory inventory and resolution/risk sign-off; preserve cross-account security gates.
5. Owner visual and interaction acceptance.

See [product direction](../../product/cozy-world-workspace-direction.md) and [PR #20](https://github.com/MohamedXIV/sengapp/pull/20).
