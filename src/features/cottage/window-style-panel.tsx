"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import { normalizeWindowStyle, MATERIALS, ATMOSPHERES, type WindowStyle } from "./window-style";

export function WindowStylePanel({ value, onChange }: {
  value: WindowStyle; onChange(next: WindowStyle): void;
}) {
  const t = useTranslations("WindowStyle");
  const opacityId = useId();
  const blurId = useId();
  const change = (patch: Partial<WindowStyle>) => onChange(normalizeWindowStyle({ ...value, ...patch }));
  return <section data-testid="window-style-panel" className="cottage-style-panel flex h-full flex-col gap-4 overflow-y-auto p-4 text-sm">
    <header className="space-y-1">
      <h2 className="text-base font-bold">{t("heading")}</h2>
      <p className="text-xs leading-relaxed opacity-75">{t("description")}</p>
    </header>
    <fieldset className="space-y-2">
      <legend className="font-semibold">{t("material")}</legend>
      <div className="grid grid-cols-3 gap-2">
        {MATERIALS.map(material => <button key={material} type="button"
          aria-pressed={value.material === material}
          className="cottage-style-choice min-h-12 rounded-xl border px-2 py-2 font-semibold"
          onClick={() => change({ material })}>{t(material)}</button>)}
      </div>
    </fieldset>
    <div className="space-y-2">
      <label className="flex justify-between gap-2 font-semibold" htmlFor={opacityId}>
        {t("opacity")} <output>{value.opacity}%</output>
      </label>
      <input className="w-full accent-[#3d755d]" id={opacityId} type="range" min="65" max="100" step="1"
        value={value.opacity} onChange={event => change({ opacity: Number(event.target.value) })}/>
    </div>
    <div className="space-y-2">
      <label className="flex justify-between gap-2 font-semibold" htmlFor={blurId}>
        {t("blur")} <output>{value.blur}px</output>
      </label>
      <input className="w-full accent-[#3d755d]" id={blurId} type="range" min="0" max="28" step="2"
        value={value.blur} onChange={event => change({ blur: Number(event.target.value) })}/>
    </div>
    <fieldset className="space-y-2">
      <legend className="font-semibold">{t("atmosphere")}</legend>
      <div className="grid grid-cols-3 gap-2">
        {ATMOSPHERES.map(atmosphere => <button key={atmosphere} type="button"
          aria-pressed={value.atmosphere === atmosphere}
          className="cottage-style-choice min-h-11 rounded-xl border px-2 py-2"
          onClick={() => change({ atmosphere })}>{t(atmosphere)}</button>)}
      </div>
    </fieldset>
    <button type="button" className="cottage-mini-button justify-center"
      onClick={() => onChange(normalizeWindowStyle(null))}>{t("reset")}</button>
    <p className="text-xs leading-relaxed opacity-70">{t("localNote")}</p>
  </section>;
}
