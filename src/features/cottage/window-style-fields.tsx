"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import { MATERIALS, ATMOSPHERES, normalizeWindowStyle, type WindowStyle } from "./window-style";

/** Shared visual controls: the same selections in Classic, Cozy and the guest preview. */
export function WindowStyleFields({ value, onChange }: {
  value: WindowStyle;
  onChange(next: WindowStyle): void;
}) {
  const t = useTranslations("WindowStyle");
  const opacityId = useId();
  const blurId = useId();
  const change = (patch: Partial<WindowStyle>) => onChange(normalizeWindowStyle({ ...value, ...patch }));

  return <div className="space-y-4 text-sm" data-testid="window-style-fields">
    <fieldset className="space-y-2">
      <legend className="font-semibold">{t("material")}</legend>
      <div className="grid grid-cols-3 gap-2">
        {MATERIALS.map(material => <button key={material} type="button"
          aria-pressed={value.material === material}
          className="cottage-style-choice min-h-11 rounded-xl border px-2 py-2 font-semibold"
          onClick={() => change({ material })}>{t(material)}</button>)}
      </div>
    </fieldset>
    <div className="grid gap-4 sm:grid-cols-2">
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
    <div data-testid="window-material-preview" data-window-material={value.material}
        data-window-atmosphere={value.atmosphere}
        className="appearance-window-preview rounded-2xl p-4">
      <div className="appearance-window-preview-card mx-auto max-w-64 overflow-hidden rounded-xl">
        <div className="appearance-window-preview-heading h-8 px-3 py-2 text-xs font-semibold">
          {t("sampleTitle")}
        </div>
        <div className="space-y-2 p-3">
          <span className="block h-2 w-3/5 rounded-full bg-current opacity-20" />
          <span className="block h-2 w-4/5 rounded-full bg-current opacity-10" />
          <span className="block h-6 w-1/2 rounded-lg bg-current opacity-10" />
        </div>
      </div>
    </div>
  </div>;
}
