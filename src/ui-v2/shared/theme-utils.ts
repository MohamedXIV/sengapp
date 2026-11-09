/** Pure preview-only semantic palette helpers. All roles accept any valid #RRGGBB color. */
export type ColorRole = "primary" | "secondary" | "accent" | "background" | "surface";
export type Palette = Record<ColorRole, string>;
export type PaletteMode = "light" | "dark";
export type PalettePair = Record<PaletteMode, Palette>;

export const THEME_PRESETS: { name: string; palettes: PalettePair }[] = [
  { name: "Garden", palettes: {
    light: { primary: "#66816C", secondary: "#DBA6AC", accent: "#E0B967", background: "#F5F0E7", surface: "#FFF9F2" },
    dark: { primary: "#A1C8AD", secondary: "#C6A0AF", accent: "#D8BA7B", background: "#252D36", surface: "#343D47" },
  } },
  { name: "Lavender", palettes: {
    light: { primary: "#8275B8", secondary: "#E1A0B9", accent: "#8DBCB5", background: "#F4F1FA", surface: "#FFFBFF" },
    dark: { primary: "#B1A4E1", secondary: "#D69DBE", accent: "#86C1BA", background: "#282638", surface: "#3A354C" },
  } },
  { name: "Sunny", palettes: {
    light: { primary: "#CE8749", secondary: "#83ACB3", accent: "#CE8DA3", background: "#FBF1E2", surface: "#FFF9EC" },
    dark: { primary: "#E5B078", secondary: "#8CBCC6", accent: "#DDA7BC", background: "#302A31", surface: "#433741" },
  } },
];

export const COLOR_ROLES: ColorRole[] = ["primary", "secondary", "accent", "background", "surface"];
export const isHex = (value: unknown): value is string => typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
export function isPalette(value: unknown): value is Palette {
  if (!value || typeof value !== "object") return false;
  const obj = value as Record<string, unknown>;
  return COLOR_ROLES.every(role => isHex(obj[role]));
}
export function hexRgb(hex: string): [number, number, number] {
  return [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16)) as [number, number, number];
}
export function rgbHex(rgb: number[]): string {
  return "#" + rgb.map(channel => Math.round(channel).toString(16).padStart(2, "0")).join("");
}
export function mix(a: string, b: string, shareB: number): string {
  const ca = hexRgb(a), cb = hexRgb(b);
  return rgbHex(ca.map((channel,i) => channel * (1-shareB) + (cb[i] ?? channel) * shareB));
}
export function hexHsl(hex: string): string {
  const [rr,gg,bb] = hexRgb(hex);
  const r=rr/255, g=gg/255, b=bb/255;
  const hi = Math.max(r,g,b), lo = Math.min(r,g,b), delta = hi-lo;
  let hue = 0, saturation = 0;
  const lightness = (hi+lo)/2;
  if (delta) {
    saturation = delta / (1-Math.abs(2*lightness-1));
    switch(hi) {
      case r: hue = ((g-b)/delta) % 6; break;
      case g: hue = (b-r)/delta+2; break;
      default: hue = (r-g)/delta+4;
    }
    hue *= 60;
  }
  return `${Math.round((hue+360)%360)} ${Math.round(saturation*1000)/10}% ${Math.round(lightness*1000)/10}%`;
}
function luminance(hex: string): number {
  const [r,g,b] = hexRgb(hex);
  const linear = (channel: number) => {const x=channel/255;return x<=.04045?x/12.92:((x+.055)/1.055)**2.4;};
  return linear(r)*.2126 + linear(g)*.7152 + linear(b)*.0722;
}
export function contrastRatio(a: string, b: string): number {
  const x = luminance(a), y = luminance(b);
  return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
}
export function readableForeground(background: string): string {
  const light = "#FFFDF7", dark = "#242A2A";
  return contrastRatio(background, light) > contrastRatio(background, dark) ? light : dark;
}

/** CSS variable values use the HSL channels already expected by globals.css; sidebar values are full colors. */
export function themeVariables(palette: Palette, mode: PaletteMode, corners: "soft"|"balanced"|"round", shadow: "none"|"soft"|"deep"): Record<string,string> {
  const foreground = readableForeground(palette.background);
  const surfaceForeground = readableForeground(palette.surface);
  const primaryText = readableForeground(palette.primary);
  const secondaryText = readableForeground(palette.secondary);
  const accentText = readableForeground(palette.accent);
  const muted = mix(palette.background, palette.surface, .65);
  const border = mix(foreground, palette.surface, mode === "light" ? .85 : .78);
  const mutedText = mix(surfaceForeground, palette.surface, mode === "light" ? .42 : .3);
  const h = hexHsl;
  return {
    "--background":h(palette.background), "--foreground":h(foreground),
    "--card":h(palette.surface), "--card-foreground":h(surfaceForeground),
    "--popover":h(palette.surface), "--popover-foreground":h(surfaceForeground),
    "--primary":h(palette.primary), "--primary-foreground":h(primaryText),
    "--secondary":h(palette.secondary), "--secondary-foreground":h(secondaryText),
    "--accent":h(palette.accent), "--accent-foreground":h(accentText),
    "--muted":h(muted), "--muted-foreground":h(mutedText),
    "--border":h(border), "--input":h(border), "--ring":h(palette.primary),
    "--sidebar":`hsl(${h(palette.surface)})`,
    "--sidebar-foreground":`hsl(${h(surfaceForeground)})`,
    "--sidebar-primary":`hsl(${h(palette.primary)})`,
    "--sidebar-primary-foreground":`hsl(${h(primaryText)})`,
    "--sidebar-accent":`hsl(${h(palette.secondary)})`,
    "--sidebar-accent-foreground":`hsl(${h(secondaryText)})`,
    "--sidebar-border":`hsl(${h(border)})`,
    "--sidebar-ring":`hsl(${h(palette.primary)})`,
    "--radius": corners==="soft" ? ".5rem" : corners==="round" ? "1.5rem" : ".875rem",
    "--sengapp-window-shadow":shadow==="none" ? "none" : shadow==="deep"
      ? "0 18px 44px rgba(30, 39, 40, .28)" : "0 12px 30px rgba(34, 41, 42, .14)",
  };
}
