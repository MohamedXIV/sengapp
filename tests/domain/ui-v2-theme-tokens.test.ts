import { describe, expect, it } from "vitest";
import { COLOR_ROLES, THEME_PRESETS, contrastRatio, hexHsl, isHex, isPalette, readableForeground, themeVariables } from "../../src/ui-v2/shared/theme-utils";

describe("UI v2 semantic palette", () => {
  it("accepts any six-digit RGB hex rather than whitelisting presets", () => {
    expect(isHex("#A1357B")).toBe(true);
    expect(isHex("#000000")).toBe(true);
    expect(isHex("#ffffff")).toBe(true);
    expect(isHex("red")).toBe(false);
    expect(isHex("#zzz111")).toBe(false);
    expect(isPalette({primary:"#010203",secondary:"#111213",accent:"#212223",background:"#313233",surface:"#414243"})).toBe(true);
  });
  it("derives shadcn HSL tokens without changing the owner's chosen colors", () => {
    const sample=THEME_PRESETS[0]!.palettes.light;
    const token=themeVariables({...sample,primary:"#A1357B"},"light","balanced","soft");
    expect(token["--primary"]).toBe(hexHsl("#A1357B"));
    expect(token["--background"]).toBe(hexHsl(sample.background));
    expect(token["--card"]).toBe(hexHsl(sample.surface));
    expect(token["--sidebar-primary"]).toContain("hsl(");
    expect(COLOR_ROLES).toHaveLength(5);
    expect(hexHsl("#FF0000")).toBe("0 100% 50%");
  });
  it("chooses readable text for any valid background while retaining original color", () => {
    for(const c of ["#000000","#FFFFFF","#A1357B","#58AFC2","#5B785D"]) {
      expect(contrastRatio(c,readableForeground(c))).toBeGreaterThanOrEqual(4.5);
    }
  });
});
