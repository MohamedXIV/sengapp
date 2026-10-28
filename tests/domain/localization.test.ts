import { describe, expect, it } from "vitest";
import en from "../../messages/en.json";
import ar from "../../messages/ar.json";
import { chooseLocale, getLocaleDirection } from "@/lib/i18n/locale";

function leafPaths(value: Record<string, unknown>, prefix = ""): string[] {
  return Object.entries(value).flatMap(([key, entry]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof entry === "string" ? [path] : leafPaths(entry as Record<string, unknown>, path);
  }).sort();
}

describe("Sengapp internationalization", () => {
  it("selects Arabic from browser language priority, with English fallback", () => {
    expect(chooseLocale("ar-EG,ar;q=0.9,en-US;q=0.8")).toBe("ar");
    expect(chooseLocale("en-US,en;q=0.9,ar;q=0.8")).toBe("en");
    expect(chooseLocale("fr-FR,fr;q=0.8,ar;q=0.6")).toBe("en");
    expect(chooseLocale(null)).toBe("en");
  });

  it("uses the account language instead of an unrelated browser preference", () => {
    expect(chooseLocale("en-US,en;q=0.9", "ar")).toBe("ar");
    expect(chooseLocale("ar-EG,ar;q=0.9", "en")).toBe("en");
    expect(chooseLocale("ar-EG", "fr")).toBe("ar");
  });

  it("resolves document direction from the UI language, not free-text preferences", () => {
    expect(getLocaleDirection("ar")).toBe("rtl");
    expect(getLocaleDirection("en")).toBe("ltr");
  });

  it("keeps English and Arabic message catalogs complete and non-empty", () => {
    expect(leafPaths(en)).toEqual(leafPaths(ar));
    for (const catalog of [en, ar]) {
      const serialized = JSON.stringify(catalog);
      expect(serialized).not.toMatch(/""/);
      expect(leafPaths(catalog)).toContain("Navigation.connections");
      expect(leafPaths(catalog)).toContain("Invites.accept");
    }
  });
});
