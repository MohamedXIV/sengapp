import type { VisualPreferences } from "./preferences";

type Appearance = "light" | "dark";
type Surface = {
  background: string; foreground: string; card: string; secondary: string;
  muted: string; mutedForeground: string; border: string;
};

// HSL channels without the hsl() wrapper, matching shadcn's semantic tokens.
// Text and surfaces are selected as a pair, independently for each appearance.
const surfaces: Record<VisualPreferences["preset"], Record<Appearance, Surface>> = {
  acorn: {
    light: { background: "36 38% 97%", foreground: "24 28% 14%", card: "36 33% 99%", secondary: "34 26% 91%", muted: "34 22% 92%", mutedForeground: "24 14% 36%", border: "32 20% 82%" },
    dark: { background: "24 22% 10%", foreground: "36 28% 93%", card: "24 20% 13%", secondary: "24 16% 18%", muted: "24 16% 17%", mutedForeground: "32 14% 72%", border: "24 16% 27%" },
  },
  forest: {
    light: { background: "142 24% 97%", foreground: "152 29% 13%", card: "130 25% 99%", secondary: "139 21% 90%", muted: "140 19% 92%", mutedForeground: "150 17% 35%", border: "140 18% 80%" },
    dark: { background: "150 26% 9%", foreground: "140 21% 94%", card: "152 23% 12%", secondary: "149 19% 18%", muted: "149 17% 17%", mutedForeground: "142 16% 73%", border: "146 15% 27%" },
  },
  dusk: {
    light: { background: "258 33% 97%", foreground: "260 30% 15%", card: "260 28% 99%", secondary: "261 25% 91%", muted: "260 21% 93%", mutedForeground: "263 17% 36%", border: "260 21% 82%" },
    dark: { background: "256 26% 10%", foreground: "267 27% 93%", card: "258 24% 13%", secondary: "260 22% 20%", muted: "260 19% 18%", mutedForeground: "264 17% 74%", border: "259 20% 29%" },
  },
  ocean: {
    light: { background: "205 39% 97%", foreground: "211 34% 14%", card: "203 36% 99%", secondary: "203 27% 90%", muted: "203 22% 92%", mutedForeground: "212 18% 35%", border: "207 19% 82%" },
    dark: { background: "214 29% 10%", foreground: "202 24% 94%", card: "215 26% 13%", secondary: "211 23% 19%", muted: "211 20% 18%", mutedForeground: "205 18% 74%", border: "211 22% 29%" },
  },
};

const accents: Record<VisualPreferences["accent"], { light: string; dark: string; tintLight: string; tintDark: string }> = {
  amber: { light: "27 75% 35%", dark: "35 88% 75%", tintLight: "40 79% 90%", tintDark: "30 39% 25%" },
  coral: { light: "8 67% 38%", dark: "11 90% 78%", tintLight: "9 76% 91%", tintDark: "8 37% 25%" },
  sage: { light: "149 44% 30%", dark: "143 54% 76%", tintLight: "145 38% 89%", tintDark: "146 33% 24%" },
  teal: { light: "185 69% 29%", dark: "177 63% 75%", tintLight: "183 48% 91%", tintDark: "182 38% 23%" },
  blue: { light: "214 73% 40%", dark: "205 92% 77%", tintLight: "210 79% 92%", tintDark: "213 39% 25%" },
  violet: { light: "267 55% 42%", dark: "266 77% 83%", tintLight: "270 72% 93%", tintDark: "264 39% 27%" },
};

export function getThemeTokens(preferences: VisualPreferences, appearance: Appearance): Record<string, string> {
  const s = surfaces[preferences.preset][appearance];
  const a = accents[preferences.accent];
  const isDark = appearance === "dark";
  const primary = isDark ? a.dark : a.light;
  const primaryForeground = isDark ? "220 29% 9%" : "0 0% 100%";
  const accent = isDark ? a.tintDark : a.tintLight;
  const accentForeground = isDark ? "0 0% 97%" : "220 30% 15%";
  return {
    "--background": s.background,
    "--foreground": s.foreground,
    "--card": s.card,
    "--card-foreground": s.foreground,
    "--popover": s.card,
    "--popover-foreground": s.foreground,
    "--primary": primary,
    "--primary-foreground": primaryForeground,
    "--secondary": s.secondary,
    "--secondary-foreground": s.foreground,
    "--muted": s.muted,
    "--muted-foreground": s.mutedForeground,
    "--accent": accent,
    "--accent-foreground": accentForeground,
    "--border": s.border,
    "--input": s.border,
    "--ring": primary,
    "--radius": { subtle: "0.375rem", soft: "0.75rem", round: "1.125rem" }[preferences.radius],
    "--font-sans-app": { system: "system-ui", inter: '"Inter Variable"', nunito: '"Nunito Variable"' }[preferences.font],
    "--sengapp-space": preferences.density === "compact" ? "1rem" : "1.5rem",
    "--sidebar": `hsl(${s.card})`,
    "--sidebar-foreground": `hsl(${s.foreground})`,
    "--sidebar-primary": `hsl(${primary})`,
    "--sidebar-primary-foreground": `hsl(${primaryForeground})`,
    "--sidebar-accent": `hsl(${accent})`,
    "--sidebar-accent-foreground": `hsl(${accentForeground})`,
    "--sidebar-border": `hsl(${s.border})`,
    "--sidebar-ring": `hsl(${primary})`,
  };
}
