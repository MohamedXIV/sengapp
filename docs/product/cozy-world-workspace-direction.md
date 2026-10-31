# Sengapp — Cozy World & Floating Workspace Direction

**Product direction accepted by owner:** 31 October 2026  
**Implementation state:** playable experimental Draft PR [#20](https://github.com/MohamedXIV/sengapp/pull/20); **not merged into main or Production**  
**Authority:** this direction supplements, and when UI/rendering assumptions conflict, supersedes the 26 October 2026 v0.1 design. Existing server-side security, messaging privacy and release gates are **not superseded**.

## North star

**A private, cozy 2D world you inhabit, with a real messenger and personal tools floating inside it.** Not a typical dashboard, marketing landing page, or game that makes people grind before messaging.

The personal room is a calm, playful place to customize and enjoy. Its surroundings can later extend to trees, a lake, rain, moving scenery or theme-specific environments. The messaging experience is still primary, usable with no world rendering, no companion and no AI.

## Confirmed product/UX decisions

1. **Human-to-human first.** Real DMs/groups, privacy, invite consent and graceful reconnection remain the core. No decorative conversation data or false unread/presence signals.
2. **Full-viewport world.** One Phaser canvas occupies the available *entire screen*, including behind a floating header and UI windows. The canvas background must blend with the scene, without an obvious rectangle/drop shadow. The landscape **logical world** is initially 1600×1000 (16:10); its coordinates are distinct from the physical screen size. A 16:9 display must not distort or forcibly crop the world.
3. **The cottage is an object, not the canvas.** Current forest room artwork is approximately 900×684 (including roof bounds), with independent furniture sprites. Outside it is real world-space available for later artwork. World type and size can vary by theme; today's 1600×1000 dimensions are an initial content configuration, not hardcoded across all future maps.
4. **2D modular isometric art**, not full 3D rooms. Keep assets independently authored and replacable; start with roughly three render concerns: static world/room, depth-sorted furniture/objects, optional atmosphere. Add draw passes only for proven needs.
5. **Furniture interaction:** a soft isometric grid with server-agnostic room data; edit mode separates moving items from moving the camera. Avoid premature free-rotation, physics, pathfinding, economies or visitor systems.
6. **Camera:** fit the **whole world** or the **room** explicitly; allow deep zoom and pan, with wheel and touch pinch; keep assets reachable and camera bounds grounded in the world. On portrait mobile, initial framing favors a usable room, while Fit World remains available.
7. **Floating personal workspace:** React/shadcn controls in moveable/resizable/dockable/pinnable-capable windows rather than a permanently bulky sidebar. Dockview React is the **desktop experiment**; mobile uses accessible touch-sized movable/resizable windows without pretending that dense desktop docking fits a phone. Pinning/auto-hide requires its own evaluation; do **not** assume enterprise-only Dockview features are free.
8. **Window look:** warm, friendly, rounded and tactile; clear handles and menus rather than many tiny caption buttons. Text, inputs, menus, focus and screen readers belong in accessible DOM, not pixels inside Phaser.
9. **Multiple personal environments over time:** forest cabin, ship cabin, starship, steampunk, elven/fantasy cottage, etc. Start with **one production-quality vertical slice**, then generalize content packs only when actual needs appear. Room is private to its owner; invited friend visits are an idea for later, **not** default visibility or a new public social feature.
10. **Companion path:** optional visual pet/character may interact with furniture and eventually move across/onto HTML windows and react to messages. This is *not yet implemented*. Its visual state is separate from an optional AI assistant; reactions and traversal must not read unauthorized content, block input or imply automatic AI access.

## Runtime/technical boundaries

| Concern | Current direction | Responsibilities and non-goals |
| --- | --- | --- |
| Next.js / React / shadcn | Remains main app shell | Real conversations, input, A11y, routes, settings, controls; fallback if renderer fails |
| Phaser 4 | Selected for 2D world prototype | One full-viewport canvas, world-space art/sprites, input, camera, later limited shaders/lights |
| Dockview React | Selected for desktop window prototype | Floating, resize, docking, tabbing and per-device layout; don't put privileged chat content in fake panels |
| Convex + Clerk | No backend change yet | Authoritative chat, membership, identity, and eventually **user-owned room layouts** with validated mutations |
| Window / room layout | Browser-local in prototype | Workspace positions per device, room data local until consented backend model exists; no sensitive data in telemetry |
| Companion overlay | Future proposal | Shared logical character state with a lightweight transparent DOM/sprite overlay above floating panels, separate from Phaser room rendering |

**Rendering is never a permission boundary.** Whether message UI is in a floating window or full-page fallback, Convex authorization and Clerk identity must work identically. The world may pause on hidden tabs, disable heavy effects on low-power/mobile devices, respect reduced motion, and be disabled without losing messaging.

## Technical validation already observed

The [Cottage Lab](https://sengapp-git-experiment-cozy-room-workspace-mxiv.vercel.app/lab/cottage) in PR #20 is a real but **illustrative** working spike: one forest scene, movable separated SVG furniture, day/evening approximation, world/room fits, pan/zoom, desktop Dockview panels, mobile touch windows, local Notes and timer.

The latest recorded exact-head GitHub CI in PR #20 passed **116 Vitest tests, 5 Node contract tests and 8 Playwright tests**, plus TypeScript/lint/build. This is not proof of physical low-end-device performance or two-finger tactile quality. **16 moderate npm advisories** were reported by CI, and must be identified and addressed or explicitly risk-assessed before adoption. It does **not** contain integrated authorized chat in the floating panel, advanced lighting, cross-window companion behavior or production art.

The earlier `unknown-yield` camera-navigation implementation was reviewed as a reference for **separating world geometry from viewport geometry**; Sengapp has a separate simpler camera, not copied code or a shared game dependency.

## First production vertical slice / acceptance

- Real authenticated DM/group entry and authorized message display from within a workspace panel, without losing accessibility, mobile keyboard/composer and privacy controls.
- A **simple direct-chat fallback** (including renderer failure, motion/battery/data-saving preference and no WebGL). User can talk without entering a room.
- One polished Forest Cabin with independently rendered, movable furniture; small affordable environment surroundings; fit world/room and robust mobile navigation.
- Window drag/resize/dock/persistence and usable mobile equivalents; rounded shadcn styling, RTL/LTR, dark/light, keyboard and reduced motion; window positions do not obscure everything on a small phone.
- Deterministic room-data IDs, asset scale and safe persistence strategy; no irreversible room schema on the basis of the current sketch.
- Measure download sizes, memory, FPS, input responsiveness and battery on at least one modest physical Android phone before declaring the renderer suitable.
- Triage npm advisories; preserve #16 multi-account auth/privacy acceptance and existing parent-first PR review/merge gates.

## What we are explicitly *not* building yet

No production AI companion, autonomous pets over conversations, public/social rooms, visitor multiplayer, virtual currency, huge furniture catalogs, 3D editor, realistic lighting system, physics, full workstation OS or new database. Notes/timer currently only demonstrate floating window UI; do not advertise them as synchronized production features.

## Links and ownership

- [Validated experiment notes](../experiments/2026-10-31-cottage-lab.md)
- [Architecture ADR 0002](../architecture/adr/0002-personal-world-and-workspace.md)
- [Human messaging roadmap](roadmap.md)
- [Technical acceptance gate #16](https://github.com/MohamedXIV/sengapp/issues/16)
- [Draft PR #20](https://github.com/MohamedXIV/sengapp/pull/20)

**Release decision:** product direction accepted; adoption/merge of the Phaser/Dockview code remains gated by review, performance, security and full chat integration.
