import { describe, expect, it } from "vitest";
import { CAMERA, ROOM_BOUNDS, ROOM_CENTER, WORLD_BOUNDS, WORLD_CENTER, clampView, fitZoom, homeView, roomFitView, zoomAt } from "@/features/cottage/room-camera";

describe("cottage viewport camera geometry", () => {
  it("includes the roof protruding above y=0 in the full-room bounds", () => {
    expect(ROOM_BOUNDS.y).toBe(-64);
    expect(ROOM_BOUNDS.height).toBe(684);
    expect(ROOM_CENTER.y).toBe(278);
    expect(WORLD_BOUNDS.width / WORLD_BOUNDS.height).toBeCloseTo(16 / 10);
    expect(WORLD_CENTER).toEqual(ROOM_CENTER);
    expect(fitZoom(1600, 1000)).toBeCloseTo(CAMERA.fitPadding);
    expect(fitZoom(1600, 1000) * ROOM_BOUNDS.width).toBeLessThan(1600);
    const zoomRoom = roomFitView(1600, 1000);
    expect(zoomRoom.level).toBeGreaterThan(1);
    expect(zoomRoom.x).toBe(ROOM_CENTER.x);
    expect(zoomRoom.y).toBe(ROOM_CENTER.y);
  });

  it("clamps camera pan to the visible room and preserves the fit center", () => {
    expect(clampView({ level: 1, x: -10000, y: 9999 }, 1600, 1000))
      .toEqual({ level: 1, ...WORLD_CENTER });
    const close = clampView({ level: 4, x: -9999, y: 9999 }, 900, 684);
    expect(close.x).toBeGreaterThan(WORLD_BOUNDS.x);
    expect(close.y).toBeLessThan(WORLD_BOUNDS.y + WORLD_BOUNDS.height);
    expect(close.level).toBe(4);
  });

  it("defaults to the wide landscape world on desktop and legible room on a phone", () => {
    expect(homeView(1440, 900)).toEqual({ level: 1, ...WORLD_CENTER });
    const phoneHome = homeView(390, 780);
    expect(phoneHome.level).toBeGreaterThan(1);
    expect(phoneHome).toEqual(roomFitView(390, 780));
    expect(fitZoom(390, 780) * WORLD_BOUNDS.width).toBeLessThan(390);
  });

  it("keeps the pointed-at world coordinate stable during zoom", () => {
    const viewport = { width: 1180, height: 790 };
    const old = { level: 3, x: 450, y: 278 };
    const anchor = { x: 650, y: 430 };
    const before = {
      x: old.x + (anchor.x - viewport.width / 2) / (fitZoom(viewport.width, viewport.height) * old.level),
      y: old.y + (anchor.y - viewport.height / 2) / (fitZoom(viewport.width, viewport.height) * old.level),
    };
    const next = zoomAt(old, 4, viewport, anchor);
    expect(next.level).toBe(4);
    expect(next.x + (anchor.x - viewport.width / 2) / (fitZoom(viewport.width, viewport.height) * next.level))
      .toBeCloseTo(before.x);
    expect(next.y + (anchor.y - viewport.height / 2) / (fitZoom(viewport.width, viewport.height) * next.level))
      .toBeCloseTo(before.y);
    expect(zoomAt(old, 999, viewport, anchor).level).toBe(CAMERA.maxLevel);
  });
});
