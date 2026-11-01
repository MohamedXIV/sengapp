"use client";
import { createContext, useContext, type ReactNode } from "react";
import { WindowStylePanel } from "./window-style-panel";
import type { WindowStyle } from "./window-style";
type WindowStyleContextValue = {
  value: WindowStyle;
  onChange(value: WindowStyle): void;
  canSaveAccount: boolean;
  onSaveAccount(): Promise<void>;
  saveStatus: "idle" | "saving" | "saved" | "error";
};
const Context = createContext<WindowStyleContextValue | null>(null);
export function WindowStyleProvider({ value, onChange, canSaveAccount, onSaveAccount, saveStatus, children }: WindowStyleContextValue & { children: ReactNode }) {
  return <Context.Provider value={{ value, onChange, canSaveAccount, onSaveAccount, saveStatus }}>{children}</Context.Provider>;
}
export function WindowStyleTool() {
  const state = useContext(Context);
  if (!state) return null;
  return <WindowStylePanel value={state.value} onChange={state.onChange}
    canSaveAccount={state.canSaveAccount} onSaveAccount={state.onSaveAccount} saveStatus={state.saveStatus} />;
}
