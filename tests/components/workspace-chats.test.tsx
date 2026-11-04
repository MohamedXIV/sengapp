import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ChatsPanel } from "@/features/cottage/workspace-panels";
import { EnglishTestProvider } from "../helpers/intl";

vi.mock("@/components/access/member-gate", () => ({
  MemberGate: ({ children, embedded }: { children: (profile: { _id: string }) => React.ReactNode; embedded: boolean }) =>
    embedded ? children({ _id: "authorized-profile" }) : null,
}));
vi.mock("@/features/chats/conversations-list", () => ({
  ConversationsList: ({ onSelect }: { onSelect: (value: string) => void }) =>
    <button type="button" onClick={() => onSelect("dm-from-real-list")}>Select Mina</button>,
}));
vi.mock("@/features/chats/direct-thread", () => ({
  DirectThread: ({ conversationId, meProfileId, onBack, embedded }: {
    conversationId: string; meProfileId: string; onBack: () => void; embedded: boolean;
  }) => <div data-testid="real-thread">
    {embedded ? "Panel thread" : "Page thread"} · {conversationId} · {meProfileId}
    <button type="button" onClick={onBack}>Back to chats</button>
  </div>,
}));

describe("embedded workspace chat flow", () => {
  it("keeps selected thread bound to the authorized member and returns to live list", () => {
    render(<EnglishTestProvider><ChatsPanel /></EnglishTestProvider>);
    expect(screen.getByTestId("cottage-live-chats")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Messages/i })).toHaveAttribute("href", "/chats");
    fireEvent.click(screen.getByRole("button", { name: "Select Mina" }));
    expect(screen.getByTestId("real-thread")).toHaveTextContent("dm-from-real-list · authorized-profile");
    fireEvent.click(screen.getByRole("button", { name: "Back to chats" }));
    expect(screen.getByRole("button", { name: "Select Mina" })).toBeInTheDocument();
  });
});
