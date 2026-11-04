import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ArabicTestProvider, EnglishTestProvider } from "../helpers/intl";
import { GroupPanel } from "@/features/chats/group-panel";
import type { Id } from "../../convex/_generated/dataModel";
import { getFunctionName } from "convex/server";

const action = vi.fn(async () => null);
const push = vi.fn();

type MockGroupDetails = {
  name: string;
  role: "owner" | "admin" | "member";
  members: Array<{
    profileId: string;
    displayName: string;
    role: "owner" | "admin" | "member";
  }>;
};

let currentGroup: MockGroupDetails = {
  name: "Forest gang",
  role: "owner",
  members: [
    { profileId: "me-id", displayName: "Alice", role: "owner" },
    { profileId: "bob-id", displayName: "Bob", role: "member" },
  ],
};

let currentContacts = [
  { profileId: "bob-id", displayName: "Bob" },
  { profileId: "carla-id", displayName: "Carla" },
];

vi.mock("convex/react", () => ({
  useQuery: (ref: Parameters<typeof getFunctionName>[0]) => {
    return getFunctionName(ref) === "groups:getDetails"
      ? currentGroup
      : currentContacts;
  },
  useMutation: () => action,
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

beforeEach(() => {
  currentGroup = {
    name: "Forest gang",
    role: "owner",
    members: [
      { profileId: "me-id", displayName: "Alice", role: "owner" },
      { profileId: "bob-id", displayName: "Bob", role: "member" },
    ],
  };
  currentContacts = [
    { profileId: "bob-id", displayName: "Bob" },
    { profileId: "carla-id", displayName: "Carla" },
  ];
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("group membership controls", () => {
  it("shows existing members and invites only contacts not already in the group", async () => {
    render(
      <EnglishTestProvider>
        <GroupPanel
          conversationId={"group-id" as Id<"conversations">}
          meProfileId={"me-id" as Id<"profiles">}
        />
      </EnglishTestProvider>,
    );
    expect(screen.getByText("Forest gang")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Invite Bob" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Invite Carla" }));
    await waitFor(() =>
      expect(action).toHaveBeenCalledWith({ conversationId: "group-id", profileId: "carla-id" }),
    );
  });

  it("cancelling member removal leaves group membership unchanged and triggers no mutation", async () => {
    render(
      <EnglishTestProvider>
        <GroupPanel
          conversationId={"group-id" as Id<"conversations">}
          meProfileId={"me-id" as Id<"profiles">}
        />
      </EnglishTestProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Remove Bob" }));

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByText("Remove Bob?")).toBeInTheDocument();
    expect(
      screen.getByText("Bob will lose access to this group and won't see future messages."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() => {
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });
    expect(action).not.toHaveBeenCalled();
  });

  it("confirming member removal triggers exactly one mutation and closes dialog on success", async () => {
    render(
      <EnglishTestProvider>
        <GroupPanel
          conversationId={"group-id" as Id<"conversations">}
          meProfileId={"me-id" as Id<"profiles">}
        />
      </EnglishTestProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Remove Bob" }));
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Remove member" }));

    await waitFor(() => {
      expect(action).toHaveBeenCalledTimes(1);
      expect(action).toHaveBeenCalledWith({ conversationId: "group-id", profileId: "bob-id" });
    });

    await waitFor(() => {
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });
  });

  it("retains actionable error and keeps dialog open when member removal mutation fails", async () => {
    action.mockRejectedValueOnce(new Error("Network failed"));

    render(
      <EnglishTestProvider>
        <GroupPanel
          conversationId={"group-id" as Id<"conversations">}
          meProfileId={"me-id" as Id<"profiles">}
        />
      </EnglishTestProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Remove Bob" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove member" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Couldn't change this membership.");
    });

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove member" })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).not.toBeDisabled();
  });

  it("cancelling leave group triggers no mutation", async () => {
    currentGroup = {
      ...currentGroup,
      role: "member",
    };

    render(
      <EnglishTestProvider>
        <GroupPanel
          conversationId={"group-id" as Id<"conversations">}
          meProfileId={"bob-id" as Id<"profiles">}
        />
      </EnglishTestProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Leave group" }));

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByText("Leave this group?")).toBeInTheDocument();
    expect(
      screen.getByText(
        "You won't receive new messages or be able to participate unless someone invites you back.",
      ),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() => {
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });
    expect(action).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it("confirming leave group triggers leave mutation, closes dialog, and redirects to /chats", async () => {
    currentGroup = {
      ...currentGroup,
      role: "member",
    };

    render(
      <EnglishTestProvider>
        <GroupPanel
          conversationId={"group-id" as Id<"conversations">}
          meProfileId={"bob-id" as Id<"profiles">}
        />
      </EnglishTestProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Leave group" }));
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();

    // The action button inside the Leave dialog has text "Leave group"
    const dialog = screen.getByRole("alertdialog");
    const confirmButton = dialog.querySelector("button.bg-destructive");
    expect(confirmButton).not.toBeNull();
    fireEvent.click(confirmButton!);

    await waitFor(() => {
      expect(action).toHaveBeenCalledWith({ conversationId: "group-id" });
      expect(push).toHaveBeenCalledWith("/chats");
    });

    await waitFor(() => {
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });
  });

  it("retains actionable error and prevents navigation when leave group fails", async () => {
    currentGroup = {
      ...currentGroup,
      role: "member",
    };
    action.mockRejectedValueOnce(new Error("Leave error"));

    render(
      <EnglishTestProvider>
        <GroupPanel
          conversationId={"group-id" as Id<"conversations">}
          meProfileId={"bob-id" as Id<"profiles">}
        />
      </EnglishTestProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Leave group" }));
    const dialog = screen.getByRole("alertdialog");
    const confirmButton = dialog.querySelector("button.bg-destructive");
    fireEvent.click(confirmButton!);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Couldn't leave the group.");
    });

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it("enforces truthful role boundaries for owner, admin, and member", () => {
    // 1. Owner view
    const { unmount } = render(
      <EnglishTestProvider>
        <GroupPanel
          conversationId={"group-id" as Id<"conversations">}
          meProfileId={"me-id" as Id<"profiles">}
        />
      </EnglishTestProvider>,
    );

    expect(screen.getByLabelText("Rename group")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Make admin Bob" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Remove Bob" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Leave group" })).not.toBeInTheDocument();
    unmount();

    // 2. Admin view
    currentGroup = {
      name: "Forest gang",
      role: "admin",
      members: [
        { profileId: "owner-id", displayName: "Alice", role: "owner" },
        { profileId: "me-id", displayName: "Bob", role: "admin" },
        { profileId: "admin2-id", displayName: "Charlie", role: "admin" },
        { profileId: "member-id", displayName: "Diana", role: "member" },
      ],
    };

    const { unmount: unmountAdmin } = render(
      <EnglishTestProvider>
        <GroupPanel
          conversationId={"group-id" as Id<"conversations">}
          meProfileId={"me-id" as Id<"profiles">}
        />
      </EnglishTestProvider>,
    );

    // Admins can rename and invite
    expect(screen.getByLabelText("Rename group")).toBeInTheDocument();
    // Admins CANNOT promote or demote anyone
    expect(screen.queryByRole("button", { name: /Make admin/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Remove admin/ })).not.toBeInTheDocument();
    // Admins CANNOT remove owner or another admin
    expect(screen.queryByRole("button", { name: "Remove Alice" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove Charlie" })).not.toBeInTheDocument();
    // Admins CAN remove ordinary member
    expect(screen.getByRole("button", { name: "Remove Diana" })).toBeInTheDocument();
    // Admins CAN leave group
    expect(screen.getByRole("button", { name: "Leave group" })).toBeInTheDocument();
    unmountAdmin();

    // 3. Ordinary member view
    currentGroup = {
      name: "Forest gang",
      role: "member",
      members: [
        { profileId: "owner-id", displayName: "Alice", role: "owner" },
        { profileId: "me-id", displayName: "Diana", role: "member" },
      ],
    };

    render(
      <EnglishTestProvider>
        <GroupPanel
          conversationId={"group-id" as Id<"conversations">}
          meProfileId={"me-id" as Id<"profiles">}
        />
      </EnglishTestProvider>,
    );

    // Member cannot rename or invite
    expect(screen.queryByLabelText("Rename group")).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Invite a connection" })).not.toBeInTheDocument();
    // Member cannot promote, demote, or remove
    expect(screen.queryByRole("button", { name: /Make admin/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Remove/ })).not.toBeInTheDocument();
    // Member CAN leave group
    expect(screen.getByRole("button", { name: "Leave group" })).toBeInTheDocument();
  });

  it("renders localized confirmation dialogs in colloquial Egyptian Arabic", async () => {
    render(
      <ArabicTestProvider>
        <GroupPanel
          conversationId={"group-id" as Id<"conversations">}
          meProfileId={"me-id" as Id<"profiles">}
        />
      </ArabicTestProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "شيل العضو Bob" }));

    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByText("تشيل Bob من المجموعة؟")).toBeInTheDocument();
    expect(
      screen.getByText("مش هيقدر يشوف الرسايل الجديدة ولا يشارك في المجموعة بعد إزالته."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "شيل من المجموعة" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "إلغاء" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "إلغاء" }));
    await waitFor(() => {
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });
  });
});
