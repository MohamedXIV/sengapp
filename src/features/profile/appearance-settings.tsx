"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePersonalTheme } from "@/components/themes/personal-theme-provider";
import {
  DEFAULT_VISUAL_PREFERENCES, THEME_ACCENTS, THEME_PRESETS,
  type VisualPreferences,
} from "@/lib/themes/preferences";

type Mode = "light" | "dark" | "system";
type AppearanceInput = VisualPreferences & { themePreference: Mode };

const presetLabels = { acorn: "Acorn", forest: "Forest", dusk: "Dusk", ocean: "Ocean" };
const accentLabels = { amber: "Amber", coral: "Coral", sage: "Sage", teal: "Teal", blue: "Blue", violet: "Violet" };
const accentColors = { amber: "#ad651a", coral: "#b74735", sage: "#357a57", teal: "#168c91", blue: "#2c68bf", violet: "#7045b5" };

export function AppearanceSettings({ initialPreferences, initialMode, onSave }: {
  initialPreferences: VisualPreferences;
  initialMode: Mode;
  onSave: (data: AppearanceInput) => Promise<void>;
}) {
  const { setPreview, previewMode, cancelPreview } = usePersonalTheme();
  const [draft, setDraft] = useState(initialPreferences);
  const [mode, setMode] = useState<Mode>(initialMode);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  // Preview is never an implicit save; leaving Settings discards it.
  useEffect(() => () => cancelPreview(), [cancelPreview]);

  function change<K extends keyof VisualPreferences>(key: K, value: VisualPreferences[K]) {
    const updated = { ...draft, [key]: value };
    setDraft(updated);
    setPreview(updated);
    setError("");
    setStatus("");
  }

  function changeMode(value: Mode) {
    setMode(value);
    previewMode(value);
    setError("");
    setStatus("");
  }

  function cancel() {
    setDraft(initialPreferences);
    setMode(initialMode);
    setError("");
    setStatus("Unsaved changes discarded.");
    cancelPreview();
  }

  function reset() {
    setDraft(DEFAULT_VISUAL_PREFERENCES);
    setMode("system");
    setPreview(DEFAULT_VISUAL_PREFERENCES);
    previewMode("system");
    setError("");
    setStatus("Defaults previewed. Save to keep them.");
  }

  async function save() {
    if (busy) return;
    setBusy(true);
    setError("");
    setStatus("");
    try {
      await onSave({ ...draft, themePreference: mode });
      setStatus("Appearance saved for your account.");
    } catch (reason) {
      cancelPreview();
      setDraft(initialPreferences);
      setMode(initialMode);
      setError(reason instanceof Error ? reason.message : "Couldn't save appearance settings.");
    } finally {
      setBusy(false);
    }
  }

  return <Card aria-label="Appearance settings">
    <CardHeader>
      <CardTitle>Appearance</CardTitle>
      <CardDescription>Make your own cozy space. Every choice stays private to your account.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-7">
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold">Theme collection</legend>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {THEME_PRESETS.map((preset) => <Button key={preset} type="button" variant="outline"
            aria-pressed={draft.preset === preset}
            className="h-24 flex-col items-start justify-between gap-2 px-3 py-3 text-start data-[pressed=true]:ring-2 data-[pressed=true]:ring-ring"
            data-pressed={draft.preset === preset}
            onClick={() => change("preset", preset)}>
            <span className={`flex gap-1.5 ${preset === "ocean" ? "text-sky-700" : preset === "forest" ? "text-emerald-700" : preset === "dusk" ? "text-violet-700" : "text-amber-700"}`} aria-hidden="true">
              <span className="size-6 rounded-full bg-current opacity-90" />
              <span className="size-6 rounded-full bg-current opacity-35" />
            </span>
            <span>{presetLabels[preset]}</span>
          </Button>)}
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold">Accent color</legend>
        <div className="flex flex-wrap gap-2">
          {THEME_ACCENTS.map((accent) => <Button key={accent} type="button" variant="outline"
            aria-label={`${accentLabels[accent]} accent`} aria-pressed={draft.accent === accent}
            className="h-11 gap-2 data-[pressed=true]:ring-2 data-[pressed=true]:ring-ring"
            data-pressed={draft.accent === accent}
            onClick={() => change("accent", accent)}>
            <span className="size-4 rounded-full" style={{ backgroundColor: accentColors[accent] }} aria-hidden="true" />
            <span>{accentLabels[accent]}</span>
          </Button>)}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="appearance-font">Typography</Label>
          <Select value={draft.font} onValueChange={(value) => change("font", value as VisualPreferences["font"])}>
            <SelectTrigger id="appearance-font" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="system">System font</SelectItem>
              <SelectItem value="inter">Inter</SelectItem>
              <SelectItem value="nunito">Nunito</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="appearance-radius">Corners</Label>
          <Select value={draft.radius} onValueChange={(value) => change("radius", value as VisualPreferences["radius"])}>
            <SelectTrigger id="appearance-radius" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="subtle">Subtle</SelectItem>
              <SelectItem value="soft">Soft</SelectItem>
              <SelectItem value="round">Round</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="appearance-density">Spacing</Label>
          <Select value={draft.density} onValueChange={(value) => change("density", value as VisualPreferences["density"])}>
            <SelectTrigger id="appearance-density" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="comfortable">Comfortable</SelectItem>
              <SelectItem value="compact">Compact</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="appearance-mode">Light / dark</Label>
          <Select value={mode} onValueChange={(value) => changeMode(value as Mode)}>
            <SelectTrigger id="appearance-mode" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="system">Follow device</SelectItem>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-lg border bg-accent p-[var(--sengapp-space,1.5rem)] text-accent-foreground" aria-label="Live theme preview">
        <p className="font-semibold">Your little corner</p>
        <p className="mt-1 text-sm">This is how Sengapp will feel. Nothing is saved until you choose Save.</p>
        <span className="mt-3 inline-flex rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">Hello, friend! 🐿️</span>
      </div>

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {status && <p role="status" className="text-sm text-muted-foreground">{status}</p>}
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save appearance"}</Button>
        <Button type="button" variant="outline" disabled={busy} onClick={cancel}>Cancel changes</Button>
        <Button type="button" variant="ghost" disabled={busy} onClick={reset}>Reset to defaults</Button>
      </div>
    </CardContent>
  </Card>;
}
