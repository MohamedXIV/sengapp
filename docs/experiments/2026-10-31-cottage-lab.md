# Sengapp Cottage Lab — experiment log, 31 October 2026

This is a **record of an implemented spike**, not an approved GDD, production roadmap, or claim of full mobile readiness.

## Why we tested it

The original logged-in app felt more like a marketing dashboard than a living messenger. We explored a new optional personal space: a **private isometric 2D room** with small productivity/messaging windows that can float or dock. The room isn't public, shared, a game economy or an obstacle to real chat.

The owner prefers 2D modular sprites over full 3D because authoring themed low-poly 3D rooms with furniture, materials and animation would increase content costs. Possible future themes include forest cottage, ship cabin, starship, steampunk and elven cottage; **only one sketch-quality forest room is implemented**.

## What is actually running

- Public lab route `/lab/cottage`, isolated from regular app routing and production Convex mutations.
- **Phaser 4.2.1** with one SVG shell, seven individually loaded movable sprites, one radial-gradient glow asset; soft 7×7 isometric grid, Y-sort and out-of-bounds / same-cell collision rules.
- **Three effective draw layers:** static room, movable decoration/furniture, optional atmospheric overlay. No extra scene subsystems yet.
- **Dockview React 8.7.0** floating, resizable and dockable React windows: Chats (link to existing member-gated UI), local Notes and an interactive 25-minute timer.
- Desktop windows restore layout from browser-local `localStorage`; smaller screens use a single tappable floating panel instead.
- Local only furniture positions / notes / Dockview layout. No Convex schema writes, no real group visits, no fake private-message data.
- 30fps target and scene pause on hidden tabs. Evening lighting is a stylized overlay and additive radial glow, **not** a Phaser Normal Map lighting benchmark.
- All assets are small authored SVG source files; proper polished sprite sheets/atlases and art pipeline remain to be decided.

## Observed checks

- Initial CI surfaced Phaser 4's required `override` on `Scene.update`; fixed.
- React 19 lint surfaced synchronous state updates in effects and a ref mutation in render; fixed without disabling lint rules.
- Locked npm install, TypeScript, lint, isometric/grid unit tests, Next build and Playwright browser smoke have passed on the pre-documentation head. New changes must rerun exact-head CI.
- Preview uses isolated Convex deployment, but the public lab does not read backend conversations.
- **npm audit warning:** initial Preview install reported **14 moderate vulnerabilities**. Cause and remedial dependency versions are **not yet verified**; do not merge to a production branch without triage.

## Open acceptance, not claims

1. Browser/device visual check: room sprite positions, texture loading, overlay lighting and click-through on exposed canvas.
2. Real **drag-drop** of furniture including rejection and restore after reload; desktop Dockview float / redock / resize / restore from storage.
3. Mobile touch interaction, memory footprint, total JS/assets transferred, FPS + battery using actual lower-end phone (CI emulation isn't a hardware benchmark).
4. Prototype parity comparison using the **same sprites** in PixiJS 8 to measure actual overhead; deferred rather than declaring Phaser faster/slower.
5. Decide art direction and whether workspace is primary, optional, or mode-selectable; keep human messenger functional independent of Phaser/WebGL.
6. Resolve / classify npm audit warnings before production adoption.

## Next discussion

Test the playable prototype together first, then decide which elements are worth retaining. Only after the hands-on feedback should we promote this into formal Sengapp design / GDD decisions.
