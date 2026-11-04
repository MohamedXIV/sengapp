export const MATERIALS = ["glass", "paper"] as const;
export const ATMOSPHERES = ["none", "mist", "rain"] as const;
export type WindowMaterial = typeof MATERIALS[number];
export type WindowAtmosphere = typeof ATMOSPHERES[number];
export type WindowStyle = { material: WindowMaterial; opacity: number; blur: number; atmosphere: WindowAtmosphere };
export const DEFAULT_WINDOW_STYLE: WindowStyle = { material: "paper", opacity: 94, blur: 18, atmosphere: "none" };
export const STYLE_STORAGE_KEY = "sengapp-lab-window-style-v1";

// Old saved "cozy" values are read as Paper; no destructive account migration.
export function normalizeWindowStyle(raw: unknown): WindowStyle {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { ...DEFAULT_WINDOW_STYLE };
  const data = raw as Record<string, unknown>;
  const valid = (value: unknown, allowed: readonly string[], fallback: string) =>
    typeof value === "string" && allowed.includes(value) ? value : fallback;
  const range = (value: unknown, min: number, max: number, fallback: number) =>
    typeof value === "number" && Number.isFinite(value) ? Math.round(Math.min(max, Math.max(min, value))) : fallback;
  return {
    material: valid(data.material, MATERIALS, "paper") as WindowMaterial,
    opacity: range(data.opacity, 65, 100, 94),
    blur: range(data.blur, 0, 28, 18),
    atmosphere: valid(data.atmosphere, ATMOSPHERES, "none") as WindowAtmosphere,
  };
}
