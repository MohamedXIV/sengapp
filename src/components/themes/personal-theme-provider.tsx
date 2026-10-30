"use client";

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from "react";
import { useTheme } from "next-themes";
import {
  resolveVisualPreferences, type VisualPreferences,
} from "@/lib/themes/preferences";
import { getThemeTokens } from "@/lib/themes/presets";

type Mode = "light" | "dark" | "system";
type PersonalThemeContext = {
  preferences: VisualPreferences;
  setPreview: (preferences: VisualPreferences | null) => void;
  previewMode: (mode: Mode | null) => void;
  cancelPreview: () => void;
};

const Context = createContext<PersonalThemeContext | null>(null);

export function usePersonalTheme() {
  const context = useContext(Context);
  if (!context) throw new Error("Personal theme controls require an authenticated app shell.");
  return context;
}

export function PersonalThemeProvider({ children, profileId, preferences, appearance, reducedMotion = false }: {
  children: ReactNode;
  profileId: string;
  preferences?: Partial<VisualPreferences>;
  appearance: Mode;
  reducedMotion?: boolean;
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const [preview, setPreview] = useState<VisualPreferences | null>(null);
  const persisted = useMemo(() => resolveVisualPreferences(preferences), [preferences]);
  const effective = preview ?? persisted;
  const tokens = useMemo(() => resolvedTheme
    ? getThemeTokens(effective, resolvedTheme === "dark" ? "dark" : "light")
    : null, [effective, resolvedTheme]);

  // Never apply one member's look to a second member. The parent keys this
  // provider by verified profile ID, and every inline token is restored.
  useLayoutEffect(() => {
    if (!tokens) return;
    const root = document.documentElement;
    const before = new Map<string, string>();
    for (const [name, value] of Object.entries(tokens)) {
      before.set(name, root.style.getPropertyValue(name));
      root.style.setProperty(name, value);
    }
    root.dataset.sengappTheme = effective.preset;
    root.dataset.sengappDensity = effective.density;
    return () => {
      for (const [name, value] of before) {
        if (value) root.style.setProperty(name, value);
        else root.style.removeProperty(name);
      }
      delete root.dataset.sengappTheme;
      delete root.dataset.sengappDensity;
    };
  }, [effective.preset, effective.density, tokens, profileId]);

  useEffect(() => {
    const root = document.documentElement;
    if (reducedMotion) root.dataset.sengappReducedMotion = "true";
    else delete root.dataset.sengappReducedMotion;
    return () => { delete root.dataset.sengappReducedMotion; };
  }, [profileId, reducedMotion]);

  useEffect(() => { setTheme(appearance); }, [appearance, profileId, setTheme]);

  const previewMode = useCallback((mode: Mode | null) => setTheme(mode ?? appearance), [setTheme, appearance]);
  const cancelPreview = useCallback(() => {
    setPreview(null);
    setTheme(appearance);
  }, [setTheme, appearance]);

  const value = useMemo<PersonalThemeContext>(() => ({
    preferences: effective,
    setPreview,
    previewMode,
    cancelPreview,
  }), [effective, previewMode, cancelPreview]);

  return <Context.Provider value={value}>{children}</Context.Provider>;
}
