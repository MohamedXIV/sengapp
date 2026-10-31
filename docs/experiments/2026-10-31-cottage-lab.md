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

## Seamless viewport feedback (31 Oct 2026)

Owner observed a rectangular canvas boundary and strong drop shadow around the original 900×620 scene. The rectangle was caused by `Scene.cameras.main.setBackgroundColor("#e4ece0")` even though the underlying game specified `transparent: true`. The drop shadow came from `.cottage-renderer`. The lab now uses a transparent, stage-sized Phaser `Scale.RESIZE` canvas, responsive camera fitting the 900×620 source room without distortion, and a single CSS background behind both the room and its surrounding free space. The separate visual canvas shadow is removed. This is a *renderer/layout* change, not a redesign or a new production requirement.

**Future companion architecture (proposal only, not implemented):** keep the independent Phaser room simulation below the UI and draw any companion that crosses React/Dockview panels in a single, transparent DOM/sprite overlay on top of the workspace. Share animation/state data and room↔screen coordinates with the room, but do not render a full second Phaser game or grant the companion access to private messages. Respect reduced motion and keep form controls unobstructed.


## Landscape world independent of the cottage — 31 October 2026

**Owner's final lab direction:** Phaser should always own the entire viewport, while the *world coordinates* are a landscape 16:10 canvas (1600 × 1000 in logical units); the 900 × 684 illustrated cottage occupies only part of that world. Exterior scenery (forest, lake, ship decks, fantasy exteriors) will become additional sprites/scene objects **inside the same Phaser world** later. No scenery catalog or new drawing layers were added in this pass.

After inspecting `MohamedXIV/unknown-yield` branch `design/ui-reskin-first-pass-20261021`, particularly `apps/web/game/camera-navigation.ts` and `components/GameHost.tsx`, adopted its key separation: simulation/world geometry does **not** equal viewport dimensions. Did not copy the other project's industrial world or navigation classes into Sengapp.

- `WORLD_BOUNDS`: independent, centered landscape 1600 × 1000 world, 16:10.
- `ROOM_BOUNDS`: separate source SVG bounds, including its roof extending above Y=0; existing furniture grid and positions unchanged.
- `Phaser.Scale.RESIZE` fills the **entire screen**, with the React toolbar floating translucently above it; UI never changes the world aspect ratio or rescales the cottage sprites non-uniformly.
- Desktop defaults to **Fit World** with the room shown smaller within the wide, initially mostly empty world. Portrait mobile defaults to **Fit Room** for readable sprites, with Fit World available any time. Both buttons are explicit, as is zoom/pan; mobile retains dock-like windows.
- Camera math clamps pan over WORLD bounds rather than ROOM bounds; the user can now explore beyond the cottage while keeping the world reachable. Camera zoom range is relative to the landscape world fit (1–8×).
- World and scene remain one Phaser instance below Dockview; no second canvas, no new backend writes.
- **Acceptance:** exact-head CI, Playwright mobile/desktop render full browser viewport with buttons and free camera movement, plus user inspection of wide framing. Real low-end mobile GPU/device testing and audit remediation are still open.
