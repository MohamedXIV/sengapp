"use client";

import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { PaletteIcon, RotateCcwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { THEME_PRESETS, COLOR_ROLES, isHex, type ColorRole, type PaletteMode } from "./theme-utils";
import { DEFAULT_APPEARANCE, useWorkspace, type Corners, type Shadow } from "./workspace-state";

const RADII: Corners[] = ["soft","balanced","round"];
const SHADOWS: Shadow[] = ["none","soft","deep"];

function ColorRolePicker({role,mode}: {role: ColorRole; mode: PaletteMode}) {
  const t=useTranslations("UiV2");
  const {appearance,updatePalette}=useWorkspace();
  const color=appearance.palettes[mode][role];
  const label=t(role);
  return (
    <div className="flex items-center gap-2 rounded-xl border bg-card p-2">
      <label className="relative size-10 shrink-0 overflow-hidden rounded-lg border shadow-xs" title={t("roleColor",{role:label})}>
        <span className="sr-only">{t("roleColor",{role:label})}</span>
        <input type="color" aria-label={t("roleColor",{role:label})}
          className="absolute -inset-2 h-14 w-14 cursor-pointer border-0 bg-transparent"
          value={color} onChange={event=>updatePalette(mode,role,event.target.value)} />
      </label>
      <div className="min-w-0 flex-1 space-y-1">
        <Label htmlFor={`sengapp-${role}-hex`} className="text-xs">{label}</Label>
        <Input key={mode+role+color} id={`sengapp-${role}-hex`}
          aria-label={t("roleHex",{role:label})} defaultValue={color}
          maxLength={7} spellCheck={false} autoCapitalize="none"
          className="h-8 min-w-0 font-mono text-xs uppercase"
          onBlur={event => {const next=event.currentTarget.value.trim(); if(isHex(next))updatePalette(mode,role,next);else event.currentTarget.value=color;}}
          onKeyDown={event=>{if(event.key==="Enter")event.currentTarget.blur();}} />
      </div>
    </div>
  );
}

/** One shared shadcn Appearance surface. All five color roles accept arbitrary colors. */
export function AppearancePanel({embedded=false}: {embedded?:boolean}) {
  const t=useTranslations("UiV2");
  const {theme,setTheme,resolvedTheme}=useTheme();
  const {appearance,updateAppearance,applyPreset}=useWorkspace();
  const mode:PaletteMode=resolvedTheme==="dark"?"dark":"light";
  return (
    <Card data-testid="shared-appearance-panel"
      className={embedded?"flex h-full flex-col gap-0 overflow-auto rounded-none border-0 shadow-none":"flex h-full flex-col gap-0 overflow-auto"}>
      <CardHeader className="px-5 py-5">
        <div className="flex items-center gap-2"><PaletteIcon className="size-4 text-muted-foreground" /><CardTitle>{t("appearance")}</CardTitle></div>
        <CardDescription>{t("personalize")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6 px-5 pb-6 pt-1">
        <section className="space-y-2" aria-label={t("language")}>
          <Label>{t("language")}</Label>
          <div role="group" aria-label={t("language")} className="flex gap-2">
            {(["en","ar"] as const).map(locale=>(
              <Button key={locale} size="sm" type="button"
                variant={appearance.locale===locale?"secondary":"outline"} aria-pressed={appearance.locale===locale}
                onClick={()=>updateAppearance({locale})}>{t(locale==="en"?"english":"arabic")}</Button>
            ))}
          </div>
        </section>
        <section className="space-y-2" aria-label={t("mode")}>
          <Label>{t("mode")}</Label>
          <div role="group" aria-label={t("mode")} className="flex flex-wrap gap-2">
            {(["light","dark","system"] as const).map(value=>(
              <Button key={value} size="sm" type="button" aria-pressed={theme===value}
                variant={theme===value?"secondary":"outline"} onClick={()=>setTheme(value)}>{t(value)}</Button>
            ))}
          </div>
        </section>
        <section className="space-y-3" aria-label={t("palette")}>
          <div className="space-y-1"><Label>{t("palette")}</Label><p className="text-xs text-muted-foreground">{t("paletteHelp")}</p></div>
          <div className="grid grid-cols-3 gap-2">
            {THEME_PRESETS.map((preset,index)=>{
              const active=COLOR_ROLES.every(role=>appearance.palettes.light[role]===preset.palettes.light[role] &&
                appearance.palettes.dark[role]===preset.palettes.dark[role]);
              return <button key={preset.name} type="button" onClick={()=>applyPreset(index)}
                aria-pressed={active} aria-label={t(index===0?"presetGarden":index===1?"presetLavender":"presetSunny")}
                className="space-y-2 rounded-xl border p-2 text-xs transition-colors hover:bg-accent/15 aria-pressed:ring-2 aria-pressed:ring-ring focus-visible:outline-2 focus-visible:outline-ring">
                <span className="flex h-5 overflow-hidden rounded-md">
                  {(["primary","secondary","accent"] as const).map(role=><span key={role}
                    className="flex-1" style={{background:preset.palettes.light[role]}} />)}
                </span>
                <span className="block truncate">{t(index===0?"presetGarden":index===1?"presetLavender":"presetSunny")}</span>
              </button>;
            })}
          </div>
          <div className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
            {COLOR_ROLES.map(role=><ColorRolePicker key={role} role={role} mode={mode}/>)}
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">{t("contrastInfo")}</p>
        </section>
        <section className="space-y-2">
          <Label>{t("cornerRadius")}</Label>
          <div role="group" aria-label={t("cornerRadius")} className="flex flex-wrap gap-2">
            {RADII.map(corners=><Button key={corners} size="sm" type="button"
              variant={appearance.corners===corners?"secondary":"outline"}
              aria-pressed={appearance.corners===corners}
              onClick={()=>updateAppearance({corners})}>{t(corners==="balanced"?"balanced":corners==="round"?"round":"subtle")}</Button>)}
          </div>
        </section>
        <section className="space-y-2">
          <Label>{t("shadowDepth")}</Label>
          <div role="group" aria-label={t("shadowDepth")} className="flex flex-wrap gap-2">
            {SHADOWS.map(shadow=><Button key={shadow} size="sm" type="button"
              variant={appearance.shadow===shadow?"secondary":"outline"}
              aria-pressed={appearance.shadow===shadow}
              onClick={()=>updateAppearance({shadow})}>{t(shadow)}</Button>)}
          </div>
        </section>
        <Button type="button" variant="ghost" size="sm" className="w-fit text-muted-foreground"
          onClick={()=>updateAppearance({palettes:DEFAULT_APPEARANCE.palettes,corners:DEFAULT_APPEARANCE.corners,shadow:DEFAULT_APPEARANCE.shadow})}>
          <RotateCcwIcon className="size-4"/>{t("restore")}
        </Button>
        <p className="text-xs leading-relaxed text-muted-foreground">{t("preferenceLocal")}</p>
      </CardContent>
    </Card>
  );
}
