import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { EnglishTestProvider } from "../helpers/intl";
import { GroupInvitations } from "@/features/chats/group-invitations";

const action = vi.fn(async () => "group-1");
const push = vi.fn();
vi.mock("convex/react", () => ({
  useQuery: () => [{ inviteId: "invite-1", conversationId: "group-1", groupName: "Fox friends", inviterName: "Alice" }],
  useMutation: () => action,
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
afterEach(() => vi.clearAllMocks());

describe("group invitations", () => {
  it("lets the recipient explicitly join from an invitation", async () => {
    render(<EnglishTestProvider><GroupInvitations /></EnglishTestProvider>);
    expect(screen.getByText("Fox friends")).toBeInTheDocument();
    expect(screen.getByText("Alice invited you")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Join group" }));
    await waitFor(() => expect(action).toHaveBeenCalledWith({ inviteId: "invite-1" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/chats/group-1"));
  });
});
