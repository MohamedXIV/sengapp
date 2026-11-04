"use client";

import { useTranslations } from "next-intl";
import { normalizeWindowStyle, type WindowStyle } from "./window-style";
import { WindowStyleFields } from "./window-style-fields";

/** Guest-only local material preview. Signed-in users edit all appearance in one form. */
export function WindowStylePanel({ value, onChange, canSaveAccount = false, onSaveAccount, saveStatus = "idle" }: {
  value: WindowStyle; onChange(next: WindowStyle): void;
  canSaveAccount?: boolean;
  onSaveAccount?: () => Promise<void>;
  saveStatus?: "idle" | "saving" | "saved" | "error";
}) {
  const t = useTranslations("WindowStyle");
  return <section data-testid="window-style-panel" className="cottage-style-panel flex h-full flex-col gap-4 overflow-y-auto p-4 text-sm">
    <header className="space-y-1">
      <h2 className="text-base font-bold">{t("heading")}</h2>
      <p className="text-xs leading-relaxed opacity-75">{t("description")}</p>
    </header>
    <WindowStyleFields value={value} onChange={onChange} />
    <button type="button" className="cottage-mini-button justify-center"
      onClick={() => onChange(normalizeWindowStyle(null))}>{t("reset")}</button>
    {canSaveAccount && onSaveAccount ? <div className="space-y-2">
      <button type="button" onClick={() => void onSaveAccount()}
        disabled={saveStatus === "saving"} className="cottage-mini-button min-h-11 w-full justify-center">
        {saveStatus === "saving" ? t("savingAccount") : t("saveAccount")}
      </button>
      {saveStatus === "saved" && <p role="status" className="text-xs">{t("savedAccount")}</p>}
      {saveStatus === "error" && <p role="alert" className="text-xs">{t("saveFailed")}</p>}
      <p className="text-xs leading-relaxed opacity-70">{t("accountNote")}</p>
    </div> : <p className="text-xs leading-relaxed opacity-70">{t("localNote")}</p>}
  </section>;
}
