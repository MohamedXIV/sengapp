import { describe, expect, it, vi, afterEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ConversationsList } from "@/features/chats/conversations-list";
import { EnglishTestProvider } from "../helpers/intl";

const records = [
  { conversationId: "dm-1", displayName: "Mina", handle: "mina", kind: "direct", updatedAt: 1700000000000 },
  { conversationId: "group-1", displayName: "Our Crew", handle: null, kind: "group", updatedAt: 1700000000100 },
];
vi.mock("convex/react", () => ({ useQuery: () => records }));
vi.mock("@/features/chats/group-create-dialog", () => ({
  GroupCreateDialog: () => <button type="button">Create group</button>,
}));
vi.mock("@/features/chats/group-invitations", () => ({
  GroupInvitations: () => <div>Invites</div>,
}));

afterEach(() => vi.clearAllMocks());

describe("reusable authorized conversation list presentation", () => {
  it("uses selectable buttons with canonical IDs in a dockable workspace", () => {
    const select = vi.fn();
    render(<EnglishTestProvider><ConversationsList compact onSelect={select} /></EnglishTestProvider>);
    expect(screen.getByText("Mina")).toBeInTheDocument();
    expect(screen.getByText("Our Crew")).toBeInTheDocument();
    expect(screen.queryByText("Create group")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Mina/i }));
    expect(select).toHaveBeenCalledWith("dm-1");
    expect(select).toHaveBeenCalledTimes(1);
  });

  it("preserves normal route links and group actions outside the workspace", () => {
    render(<EnglishTestProvider><ConversationsList /></EnglishTestProvider>);
    expect(screen.getByText("Create group")).toBeInTheDocument();
    expect(screen.getByText("Invites")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Mina/i })).toHaveAttribute("href", "/chats/dm-1");
  });
});
