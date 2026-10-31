import { ROOM } from "./room-model";

// The hand-authored roof crosses y=0. This extends the SVG viewport upward
// rather than attempting to repair clipped art through camera offsets.
export const ROOM_BOUNDS = {
  x: 0, y: -64, width: ROOM.width, height: ROOM.height + 64,
} as const;

export const CAMERA = {
  fitPadding: 0.91,
  minLevel: 1,
  maxLevel: 5.5,
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
  return Math.max(0.001, Math.min(width / ROOM_BOUNDS.width, height / ROOM_BOUNDS.height) * CAMERA.fitPadding);
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
    x: clampAxis(view.x, ROOM_BOUNDS.x, ROOM_BOUNDS.width, width / zoom),
    y: clampAxis(view.y, ROOM_BOUNDS.y, ROOM_BOUNDS.height, height / zoom),
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
