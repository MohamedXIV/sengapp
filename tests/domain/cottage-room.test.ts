import { describe, expect, it } from "vitest";
import { CATALOG, INITIAL_ITEMS, canPlace, inRoom, parseRoom, toCell, toScreen, updatePlacement } from "@/features/cottage/room-model";

describe("cottage room data rules", () => {
  it("round-trips isometric coordinates without drift", () => {
    for (let x = 0; x < 7; x++) for (let y = 0; y < 7; y++) {
      const pixel = toScreen(x, y);
      expect(toCell(pixel.x, pixel.y)).toEqual({ x, y });
    }
  });
  it("prevents invalid placement and collisions on the soft grid", () => {
    expect(inRoom(7, 0)).toBe(false);
    const sofa = INITIAL_ITEMS.find(item => item.id === "sofa")!;
    expect(canPlace(INITIAL_ITEMS, "chair", sofa.x, sofa.y)).toBe(false);
    expect(updatePlacement(INITIAL_ITEMS, "chair", -1, 5)).toEqual(INITIAL_ITEMS);
    expect(canPlace(INITIAL_ITEMS, "rug", sofa.x, sofa.y)).toBe(true);
  });
  it("restores only a complete validated room layout, with no unknown items", () => {
    const updated = updatePlacement(INITIAL_ITEMS, "cat", 5, 6);
    expect(updated).not.toEqual(INITIAL_ITEMS);
    expect(parseRoom(JSON.stringify(updated))).toEqual(updated);
    expect(parseRoom("{")).toEqual(INITIAL_ITEMS);
    expect(parseRoom(JSON.stringify([{id:"evil",x:1,y:1}]))).toEqual(INITIAL_ITEMS);
    expect(Object.keys(CATALOG)).toHaveLength(INITIAL_ITEMS.length);
  });
});
