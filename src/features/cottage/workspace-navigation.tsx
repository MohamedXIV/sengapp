"use client";
import { createContext, useContext, type ReactNode } from "react";
import type { Id } from "../../../convex/_generated/dataModel";
export type WorkspaceNavigation = {
  selectedConversation: Id<"conversations"> | null;
  openConversation(conversationId: Id<"conversations">): void;
  returnToConversations(): void;
};
const Context = createContext<WorkspaceNavigation | null>(null);
export function WorkspaceNavigationProvider({ value, children }: { value: WorkspaceNavigation; children: ReactNode }) {
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useWorkspaceNavigation() { return useContext(Context); }
