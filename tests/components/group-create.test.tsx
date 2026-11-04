import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { EnglishTestProvider } from "../helpers/intl";
import { GroupCreateDialog } from "@/features/chats/group-create-dialog";

const create = vi.fn(async () => "new-group-id");
const push = vi.fn();
vi.mock("convex/react", () => ({ useMutation: () => create }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
afterEach(() => vi.clearAllMocks());

describe("private group creation", () => {
  it("creates a named group and opens its conversation", async () => {
    render(<EnglishTestProvider><GroupCreateDialog /></EnglishTestProvider>);
    fireEvent.click(screen.getByRole("button", { name: "New group" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Group name" }), { target: { value: "  Friends corner  " } });
    fireEvent.click(screen.getByRole("button", { name: "Create group" }));
    await waitFor(() => expect(create).toHaveBeenCalledWith({ name: "Friends corner" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/chats/new-group-id"));
  });

  it("shows a helpful error when group creation fails", async () => {
    create.mockRejectedValueOnce(new Error("Unavailable"));
    render(<EnglishTestProvider><GroupCreateDialog /></EnglishTestProvider>);
    fireEvent.click(screen.getByRole("button", { name: "New group" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Group name" }), { target: { value: "Friends" } });
    fireEvent.click(screen.getByRole("button", { name: "Create group" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("couldn't create"));
    expect(push).not.toHaveBeenCalled();
  });
});
