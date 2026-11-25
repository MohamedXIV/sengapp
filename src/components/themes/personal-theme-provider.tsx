"use client";

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from "react";
import { useTheme } from "next-themes";
import {
  resolveVisualPreferences, type VisualPreferences,
} from "@/lib/themes/preferences";
import { getThemeTokens } from "@/lib/themes/presets";
import { DEFAULT_WINDOW_STYLE, normalizeWindowStyle, type WindowStyle } from "@/features/cottage/window-style";

type Mode = "light" | "dark" | "system";
type PersonalThemeContext = {
  preferences: VisualPreferences;
  windowStyle: WindowStyle;
  setPreview: (preferences: VisualPreferences | null) => void;
  setWindowStylePreview: (style: WindowStyle | null) => void;
  previewMode: (mode: Mode | null) => void;
  cancelPreview: () => void;
};

const Context = createContext<PersonalThemeContext | null>(null);

export function usePersonalTheme() {
  const context = useContext(Context);
  if (!context) throw new Error("Personal theme controls require an authenticated app shell.");
  return context;
}

export function PersonalThemeProvider({ children, profileId, preferences, windowStyle, appearance, reducedMotion = false }: {
  children: ReactNode;
  profileId: string;
  preferences?: Partial<VisualPreferences>;
  windowStyle?: Partial<WindowStyle> | null;
  appearance: Mode;
  reducedMotion?: boolean;
}) {
  // Prevent nested embedded panels (e.g. inside Cottage Dockview) from fighting
  // over document.documentElement tokens when a parent provider already owns them.
  const parent = useContext(Context);
  if (parent) return <>{children}</>;

  return <PersonalThemeProviderRoot
    profileId={profileId}
    preferences={preferences}
    windowStyle={windowStyle}
    appearance={appearance}
    reducedMotion={reducedMotion}
  >{children}</PersonalThemeProviderRoot>;
}

function PersonalThemeProviderRoot({ children, profileId, preferences, windowStyle, appearance, reducedMotion = false }: {
  children: ReactNode;
  profileId: string;
  preferences?: Partial<VisualPreferences>;
  windowStyle?: Partial<WindowStyle> | null;
  appearance: Mode;
  reducedMotion?: boolean;
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const [preview, setPreview] = useState<VisualPreferences | null>(null);
  const [stylePreview, setStylePreview] = useState<WindowStyle | null>(null);
  const persisted = useMemo(() => resolveVisualPreferences(preferences), [preferences]);
  const persistedStyle = useMemo(
    () => (windowStyle ? normalizeWindowStyle(windowStyle) : DEFAULT_WINDOW_STYLE),
    [windowStyle],
  );
  const effective = preview ?? persisted;
  const effectiveStyle = stylePreview ?? persistedStyle;
  // Paper is intentionally a warm sepia-only skin (dark mode does not apply to paper).
  const effectiveAppearance = effectiveStyle.material === "paper"
    ? "light"
    : (resolvedTheme === "dark" ? "dark" : "light");
  const tokens = useMemo(() => resolvedTheme
    ? getThemeTokens(effective, effectiveAppearance)
    : null, [effective, effectiveAppearance, resolvedTheme]);

  // Never apply one member's look to a second member. The parent keys this
  // provider by verified profile ID, and every inline token is restored.
  useLayoutEffect(() => {
    if (!tokens) return;
    const root = document.documentElement;
    const before = new Map<string, string>();
    const allTokens: Record<string, string> = {
      ...tokens,
      "--sengapp-glass-opacity": `${effectiveStyle.opacity}%`,
      "--sengapp-glass-blur": `${effectiveStyle.blur}px`,
    };
    for (const [name, value] of Object.entries(allTokens)) {
      before.set(name, root.style.getPropertyValue(name));
      root.style.setProperty(name, value);
    }
    root.dataset.sengappTheme = effective.preset;
    root.dataset.sengappDensity = effective.density;
    root.dataset.sengappSkin = effectiveStyle.material;
    root.dataset.sengappAtmosphere = effectiveStyle.atmosphere;
    return () => {
      for (const [name, value] of before) {
        if (value) root.style.setProperty(name, value);
        else root.style.removeProperty(name);
      }
      delete root.dataset.sengappTheme;
      delete root.dataset.sengappDensity;
      delete root.dataset.sengappSkin;
      delete root.dataset.sengappAtmosphere;
    };
  }, [effective.preset, effective.density, effectiveStyle, tokens, profileId]);

  useEffect(() => {
    const root = document.documentElement;
    if (reducedMotion) root.dataset.sengappReducedMotion = "true";
    else delete root.dataset.sengappReducedMotion;
    return () => { delete root.dataset.sengappReducedMotion; };
  }, [profileId, reducedMotion]);

  useEffect(() => { setTheme(appearance); }, [appearance, profileId, setTheme]);

  const setWindowStylePreview = useCallback((next: WindowStyle | null) => {
    setStylePreview(next ? normalizeWindowStyle(next) : null);
  }, []);
  const previewMode = useCallback((mode: Mode | null) => setTheme(mode ?? appearance), [setTheme, appearance]);
  const cancelPreview = useCallback(() => {
    setPreview(null);
    setStylePreview(null);
    setTheme(appearance);
  }, [setTheme, appearance]);

  const value = useMemo<PersonalThemeContext>(() => ({
    preferences: effective,
    windowStyle: effectiveStyle,
    setPreview,
    setWindowStylePreview,
    previewMode,
    cancelPreview,
  }), [effective, effectiveStyle, setWindowStylePreview, previewMode, cancelPreview]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}
