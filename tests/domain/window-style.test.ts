import { describe, expect, it } from "vitest";
import { DEFAULT_WINDOW_STYLE, normalizeWindowStyle } from "@/features/cottage/window-style";

describe("window material choices", () => {
  it("defaults safely on broken or untrusted stored data", () => {
    expect(normalizeWindowStyle(null)).toEqual(DEFAULT_WINDOW_STYLE);
    expect(normalizeWindowStyle({ material: "<script>", opacity: "90", blur: 1 / 0, atmosphere: "unknown" }))
      .toEqual({ ...DEFAULT_WINDOW_STYLE });
  });
  it("migrates obsolete cozy to paper without discarding other style fields", () => {
    expect(normalizeWindowStyle({ material: "cozy", opacity: 74, blur: 20, atmosphere: "rain" }))
      .toEqual({ material: "paper", opacity: 74, blur: 20, atmosphere: "rain" });
    expect(normalizeWindowStyle({ material: "paper", opacity: 94, blur: 18, atmosphere: "none" }))
      .toEqual(DEFAULT_WINDOW_STYLE);
  });

  it("clamps expensive blur and transparency and permits controlled weather only", () => {
    expect(normalizeWindowStyle({ material: "glass", opacity: -300, blur: 1000, atmosphere: "rain" }))
      .toEqual({ material: "glass", opacity: 65, blur: 28, atmosphere: "rain" });
    expect(normalizeWindowStyle({ material: "paper", opacity: 99.8, blur: 3.2, atmosphere: "mist" }))
      .toEqual({ material: "paper", opacity: 100, blur: 3, atmosphere: "mist" });
  });
});
