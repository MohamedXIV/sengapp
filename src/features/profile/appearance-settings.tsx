"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePersonalTheme } from "@/components/themes/personal-theme-provider";
import { DEFAULT_VISUAL_PREFERENCES, THEME_ACCENTS, THEME_PRESETS,
  THEME_SHADOWS, type VisualPreferences } from "@/lib/themes/preferences";

type Mode = "light" | "dark" | "system";
type AppearanceInput = VisualPreferences & { themePreference: Mode };

const accentColors = {
  amber: "#ad651a", coral: "#b74735", sage: "#357a57",
  teal: "#168c91", blue: "#2c68bf", violet: "#7045b5",
};

/** The *single* Appearance editor for Classic pages and Cozy floating windows.
 * Legacy material preferences are kept in storage for compatibility, but are
 * not part of the v2 product design. Preview never silently saves. */
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

  useEffect(() => () => cancelPreview(), [cancelPreview]);

  function change<K extends keyof VisualPreferences>(key: K, value: VisualPreferences[K]) {
    const next = { ...draft, [key]: value };
    setDraft(next);
    setPreview(next);
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
    // New accounts default to Light; Reset should match that product default.
    setModeDraft({ base: initialMode, value: "light" });
    setPreview(DEFAULT_VISUAL_PREFERENCES);
    previewMode("light");
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

  return <Card aria-label={t("aria")} className="max-w-3xl">
    <CardHeader>
      <CardTitle>{t("title")}</CardTitle>
      <CardDescription>{t("description")}</CardDescription>
    </CardHeader>
    <CardContent className="space-y-6">
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold">{t("collection")}</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {THEME_PRESETS.map(preset => <Button key={preset} type="button" variant="outline"
            aria-pressed={draft.preset === preset} data-pressed={draft.preset === preset}
            className="h-20 flex-col items-start justify-between gap-2 px-3 py-2 text-start data-[pressed=true]:ring-2 data-[pressed=true]:ring-ring"
            onClick={() => change("preset", preset)}>
            <span className={`flex gap-1.5 ${preset === "ocean" ? "text-sky-700" : preset === "forest" ? "text-emerald-700" : preset === "dusk" ? "text-violet-700" : "text-amber-700"}`}
              aria-hidden="true">
              <span className="size-5 rounded-full bg-current opacity-90"/>
              <span className="size-5 rounded-full bg-current opacity-35"/>
            </span>
            <span>{t(preset)}</span>
          </Button>)}
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold">{t("accent")}</legend>
        <div className="flex flex-wrap gap-2">
          {THEME_ACCENTS.map(accent => <Button key={accent} type="button" variant="outline"
            aria-label={t("accentLabel", { color: t(accent) })}
            aria-pressed={draft.accent === accent}
            data-pressed={draft.accent === accent}
            className="min-h-11 gap-2 data-[pressed=true]:ring-2 data-[pressed=true]:ring-ring"
            onClick={() => change("accent", accent)}>
            <span className="size-4 rounded-full" style={{ backgroundColor: accentColors[accent] }} aria-hidden="true"/>
            {t(accent)}
          </Button>)}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="appearance-font">{t("typography")}</Label>
          <Select value={draft.font} onValueChange={value => change("font", value as VisualPreferences["font"])}>
            <SelectTrigger id="appearance-font" className="w-full"><SelectValue/></SelectTrigger>
            <SelectContent>
              <SelectItem value="system">{t("systemFont")}</SelectItem>
              <SelectItem value="inter">Inter</SelectItem>
              <SelectItem value="nunito">Nunito</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="appearance-radius">{t("corners")}</Label>
          <Select value={draft.radius} onValueChange={value => change("radius", value as VisualPreferences["radius"])}>
            <SelectTrigger id="appearance-radius" className="w-full"><SelectValue/></SelectTrigger>
            <SelectContent>
              <SelectItem value="subtle">{t("subtle")}</SelectItem>
              <SelectItem value="soft">{t("soft")}</SelectItem>
              <SelectItem value="round">{t("round")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="appearance-density">{t("spacing")}</Label>
          <Select value={draft.density} onValueChange={value => change("density", value as VisualPreferences["density"])}>
            <SelectTrigger id="appearance-density" className="w-full"><SelectValue/></SelectTrigger>
            <SelectContent>
              <SelectItem value="comfortable">{t("comfortable")}</SelectItem>
              <SelectItem value="compact">{t("compact")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="appearance-mode">{t("lightDark")}</Label>
          <Select value={mode} onValueChange={value => changeMode(value as Mode)}>
            <SelectTrigger id="appearance-mode" className="w-full"><SelectValue/></SelectTrigger>
            <SelectContent>
              <SelectItem value="system">{t("followDevice")}</SelectItem>
              <SelectItem value="light">{t("light")}</SelectItem>
              <SelectItem value="dark">{t("dark")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <fieldset className="space-y-3" data-testid="appearance-shadow-options">
        <legend className="text-sm font-semibold">{t("shadowLevel")}</legend>
        <div className="grid grid-cols-3 gap-2">
          {THEME_SHADOWS.map(shadow => <Button key={shadow} type="button" variant="outline"
            aria-label={t(`shadow_${shadow}`)} aria-pressed={draft.shadow === shadow}
            data-pressed={draft.shadow === shadow}
            className="h-auto min-h-16 flex-col gap-2 rounded-lg data-[pressed=true]:ring-2 data-[pressed=true]:ring-ring"
            onClick={() => change("shadow", shadow)}>
            <span aria-hidden="true" className="size-7 rounded-lg border bg-card"
              style={{ boxShadow: {
                none: "none",
                soft: "0 3px 9px hsl(var(--foreground) / 0.12)",
                raised: "0 6px 15px hsl(var(--foreground) / 0.24)",
              }[shadow] }}/>
            {t(`shadow_${shadow}`)}
          </Button>)}
        </div>
      </fieldset>

      <div className="space-y-3 rounded-[var(--radius)] border bg-background p-[var(--sengapp-space,1.5rem)]"
        aria-label={t("previewAria")} data-testid="appearance-shared-preview">
        <p className="text-sm font-semibold">{t("previewTitle")}</p>
        <p className="text-xs text-muted-foreground">{t("sharedPreviewNote")}</p>
        <div className="space-y-3 rounded-[var(--radius)] border bg-card p-3 [box-shadow:var(--sengapp-shadow-card)]">
          <p className="text-sm font-medium">{t("previewDescription")}</p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-[var(--radius)] bg-primary px-3 py-2 text-xs text-primary-foreground">{t("hello")}</span>
            <span className="rounded-[var(--radius)] border bg-secondary px-3 py-2 text-xs">{t("previewReply")}</span>
          </div>
        </div>
      </div>

      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {status && <p role="status" className="text-sm text-muted-foreground">{status}</p>}
      <div className="flex flex-wrap gap-2">
        <Button type="button" disabled={busy} onClick={save}>{busy ? common("saving") : t("save")}</Button>
        <Button type="button" variant="outline" disabled={busy} onClick={cancel}>{t("cancel")}</Button>
        <Button type="button" variant="ghost" disabled={busy} onClick={reset}>{t("reset")}</Button>
      </div>
    </CardContent>
  </Card>;
}
