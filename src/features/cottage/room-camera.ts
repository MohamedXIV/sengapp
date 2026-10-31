import { ROOM } from "./room-model";

// The hand-authored roof crosses y=0. This extends the SVG viewport upward
// rather than attempting to repair clipped art through camera offsets.
export const ROOM_BOUNDS = {
  x: 0, y: -64, width: ROOM.width, height: ROOM.height + 64,
} as const;

// Landscape world coordinates are deliberately independent from the window's
// pixel dimensions and from the cottage SVG bounds. Future outdoor assets
// (trees, pond, weather, paths) can occupy these coordinates without redoing
// the camera or furniture layout.
export const WORLD_BOUNDS = {
  x: -350, y: -222, width: 1600, height: 1000, aspect: "16:10",
} as const;

export const WORLD_CENTER = {
  x: WORLD_BOUNDS.x + WORLD_BOUNDS.width / 2,
  y: WORLD_BOUNDS.y + WORLD_BOUNDS.height / 2,
} as const;

export const CAMERA = {
  fitPadding: 0.91,
  minLevel: 1,
  maxLevel: 8,
  buttonFactor: 1.35,
  wheelFactor: 1.12,
  edgePadding: 22,
} as const;

export type CameraView = { level: number; x: number; y: number };
export const ROOM_CENTER = {
  x: ROOM_BOUNDS.x + ROOM_BOUNDS.width / 2,
  y: ROOM_BOUNDS.y + ROOM_BOUNDS.height / 2,
} as const;

export function clampLevel(level: number): number {
  return Math.min(CAMERA.maxLevel, Math.max(CAMERA.minLevel, Number.isFinite(level) ? level : 1));
}

export function fitZoom(width: number, height: number): number {
  if (width <= 0 || height <= 0) return 1;
  return Math.max(0.001, Math.min(width / WORLD_BOUNDS.width, height / WORLD_BOUNDS.height) * CAMERA.fitPadding);
}

/** The room is only one entity within the world; fitting it zooms into the
 * world camera, instead of resizing the Phaser renderer to the SVG. */
export function roomFitView(width: number, height: number): CameraView {
  if (width <= 0 || height <= 0) return { level: 1, ...ROOM_CENTER };
  const zoom = Math.min(width / ROOM_BOUNDS.width, height / ROOM_BOUNDS.height) * CAMERA.fitPadding;
  return clampView({
    level: zoom / fitZoom(width, height),
    ...ROOM_CENTER,
  }, width, height);
}

export function homeView(width: number, height: number): CameraView {
  // A portrait device still hosts the same 16:10 world, but initially
  // frames the cottage to keep furniture readable and touch targets useful.
  return width < 600 && height > width
    ? roomFitView(width, height)
    : { level: 1, ...WORLD_CENTER };
}

function clampAxis(value: number, start: number, size: number, visible: number): number {
  const low = start - CAMERA.edgePadding + visible / 2;
  const high = start + size + CAMERA.edgePadding - visible / 2;
  if (low > high) return start + size / 2;
  return Math.min(high, Math.max(low, value));
}

export function clampView(view: CameraView, width: number, height: number): CameraView {
  const level = clampLevel(view.level);
  const zoom = fitZoom(width, height) * level;
  return {
    level,
    x: clampAxis(view.x, WORLD_BOUNDS.x, WORLD_BOUNDS.width, width / zoom),
    y: clampAxis(view.y, WORLD_BOUNDS.y, WORLD_BOUNDS.height, height / zoom),
  };
}

export function zoomAt(view: CameraView, level: number,
  viewport: { width: number; height: number }, anchor: { x: number; y: number },
  nextAnchor = anchor): CameraView {
  const oldZoom = fitZoom(viewport.width, viewport.height) * clampLevel(view.level);
  const newLevel = clampLevel(level);
  const nextZoom = fitZoom(viewport.width, viewport.height) * newLevel;
  const worldX = view.x + (anchor.x - viewport.width / 2) / oldZoom;
  const worldY = view.y + (anchor.y - viewport.height / 2) / oldZoom;
  return clampView({
    level: newLevel,
    x: worldX - (nextAnchor.x - viewport.width / 2) / nextZoom,
    y: worldY - (nextAnchor.y - viewport.height / 2) / nextZoom,
  }, viewport.width, viewport.height);
}
