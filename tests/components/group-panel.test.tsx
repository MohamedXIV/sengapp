import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { EnglishTestProvider } from "../helpers/intl";
import { GroupPanel } from "@/features/chats/group-panel";
import type { Id } from "../../convex/_generated/dataModel";
import { getFunctionName } from "convex/server";

const action = vi.fn(async () => null);
const push = vi.fn();
vi.mock("convex/react", () => ({
  useQuery: (ref: Parameters<typeof getFunctionName>[0]) => {
    return getFunctionName(ref) === "groups:getDetails"
      ? { name: "Forest gang", role: "owner", members: [
        { profileId: "me-id", displayName: "Alice", role: "owner" },
        { profileId: "bob-id", displayName: "Bob", role: "member" },
      ] }
      : [{ profileId: "bob-id", displayName: "Bob" }, { profileId: "carla-id", displayName: "Carla" }];
  },
  useMutation: () => action,
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
afterEach(() => { vi.clearAllMocks(); });

describe("group membership controls", () => {
  it("shows existing members and invites only contacts not already in the group", async () => {
    render(<EnglishTestProvider><GroupPanel
      conversationId={"group-id" as Id<"conversations">} meProfileId={"me-id" as Id<"profiles">}
    /></EnglishTestProvider>);
    expect(screen.getByText("Forest gang")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Invite Bob" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Invite Carla" }));
    await waitFor(() => expect(action).toHaveBeenCalledWith({ conversationId: "group-id", profileId: "carla-id" }));
  });
});
