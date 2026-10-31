"use client";
import { createContext, useContext, type ReactNode } from "react";
import { WindowStylePanel } from "./window-style-panel";
import type { WindowStyle } from "./window-style";
const Context = createContext<{ value: WindowStyle; onChange(value: WindowStyle): void } | null>(null);
export function WindowStyleProvider({ value, onChange, children }: {
  value: WindowStyle; onChange(value: WindowStyle): void; children: ReactNode;
}) { return <Context.Provider value={{ value, onChange }}>{children}</Context.Provider>; }
export function WindowStyleTool() {
  const state = useContext(Context);
  if (!state) return null;
  return <WindowStylePanel value={state.value} onChange={state.onChange} />;
}
