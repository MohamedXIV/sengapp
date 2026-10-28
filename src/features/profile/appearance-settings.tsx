"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
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

const accentColors = { amber: "#ad651a", coral: "#b74735", sage: "#357a57", teal: "#168c91", blue: "#2c68bf", violet: "#7045b5" };

export function AppearanceSettings({ initialPreferences, initialMode, onSave }: {
  initialPreferences: VisualPreferences;
  initialMode: Mode;
  onSave: (data: AppearanceInput) => Promise<void>;
}) {
  const t = useTranslations("Appearance");
  const common = useTranslations("Common");
  const locale = useLocale();
  const { setPreview, previewMode, cancelPreview } = usePersonalTheme();
  const [draft, setDraft] = useState(initialPreferences);
  const [modeDraft, setModeDraft] = useState<{ base: Mode; value: Mode }>({
    base: initialMode, value: initialMode,
  });
  const mode = modeDraft.base === initialMode ? modeDraft.value : initialMode;
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
    setModeDraft({ base: initialMode, value });
    previewMode(value);
    setError("");
    setStatus("");
  }

  function cancel() {
    setDraft(initialPreferences);
    setModeDraft({ base: initialMode, value: initialMode });
    setError("");
    setStatus(t("discarded"));
    cancelPreview();
  }

  function reset() {
    setDraft(DEFAULT_VISUAL_PREFERENCES);
    setModeDraft({ base: initialMode, value: "system" });
    setPreview(DEFAULT_VISUAL_PREFERENCES);
    previewMode("system");
    setError("");
    setStatus(t("resetPreview"));
  }

  async function save() {
    if (busy) return;
    setBusy(true);
    setError("");
    setStatus("");
    try {
      await onSave({ ...draft, themePreference: mode });
      setStatus(t("saved"));
    } catch (reason) {
      cancelPreview();
      setDraft(initialPreferences);
      setModeDraft({ base: initialMode, value: initialMode });
      setError(locale === "en" && reason instanceof Error ? reason.message : t("saveFailed"));
    } finally {
      setBusy(false);
    }
  }

  return <Card aria-label={t("aria")}>
    <CardHeader>
      <CardTitle>{t("title")}</CardTitle>
      <CardDescription>{t("description")}</CardDescription>
    </CardHeader>
    <CardContent className="space-y-7">
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold">{t("collection")}</legend>
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
            <span>{t(preset)}</span>
          </Button>)}
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold">{t("accent")}</legend>
        <div className="flex flex-wrap gap-2">
          {THEME_ACCENTS.map((accent) => <Button key={accent} type="button" variant="outline"
            aria-label={t("accentLabel", { color: t(accent) })} aria-pressed={draft.accent === accent}
            className="h-11 gap-2 data-[pressed=true]:ring-2 data-[pressed=true]:ring-ring"
            data-pressed={draft.accent === accent}
            onClick={() => change("accent", accent)}>
            <span className="size-4 rounded-full" style={{ backgroundColor: accentColors[accent] }} aria-hidden="true" />
            <span>{t(accent)}</span>
          </Button>)}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="appearance-font">{t("typography")}</Label>
          <Select value={draft.font} onValueChange={(value) => change("font", value as VisualPreferences["font"])}>
            <SelectTrigger id="appearance-font" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="system">{t("systemFont")}</SelectItem>
              <SelectItem value="inter">Inter</SelectItem>
              <SelectItem value="nunito">Nunito</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="appearance-radius">{t("corners")}</Label>
          <Select value={draft.radius} onValueChange={(value) => change("radius", value as VisualPreferences["radius"])}>
            <SelectTrigger id="appearance-radius" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="subtle">{t("subtle")}</SelectItem>
              <SelectItem value="soft">{t("soft")}</SelectItem>
              <SelectItem value="round">{t("round")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="appearance-density">{t("spacing")}</Label>
          <Select value={draft.density} onValueChange={(value) => change("density", value as VisualPreferences["density"])}>
            <SelectTrigger id="appearance-density" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="comfortable">{t("comfortable")}</SelectItem>
              <SelectItem value="compact">{t("compact")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="appearance-mode">{t("lightDark")}</Label>
          <Select value={mode} onValueChange={(value) => changeMode(value as Mode)}>
            <SelectTrigger id="appearance-mode" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="system">{t("followDevice")}</SelectItem>
              <SelectItem value="light">{t("light")}</SelectItem>
              <SelectItem value="dark">{t("dark")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-lg border bg-accent p-[var(--sengapp-space,1.5rem)] text-accent-foreground" aria-label={t("previewAria")}>
        <p className="font-semibold">{t("previewTitle")}</p>
        <p className="mt-1 text-sm">{t("previewDescription")}</p>
        <span className="mt-3 inline-flex rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">{t("hello")}</span>
      </div>

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {status && <p role="status" className="text-sm text-muted-foreground">{status}</p>}
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={save} disabled={busy}>{busy ? common("saving") : t("save")}</Button>
        <Button type="button" variant="outline" disabled={busy} onClick={cancel}>{t("cancel")}</Button>
        <Button type="button" variant="ghost" disabled={busy} onClick={reset}>{t("reset")}</Button>
      </div>
    </CardContent>
  </Card>;
}
