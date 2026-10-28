import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { OpenDirectButton } from "@/features/chats/open-direct-button";
import { EnglishTestProvider } from "../helpers/intl";
import type { Id } from "../../convex/_generated/dataModel";

const open = vi.fn(async () => "conv-123");
const push = vi.fn();
vi.mock("convex/react", () => ({ useMutation: () => open }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
afterEach(() => { vi.clearAllMocks(); });

describe("opening a private DM from a connection", () => {
  it("creates or finds the accepted connection's DM and navigates", async () => {
    render(<EnglishTestProvider><OpenDirectButton connectionId={"connection-123" as Id<"connections">} /></EnglishTestProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Message" }));
    await waitFor(() => expect(open).toHaveBeenCalledWith({ connectionId: "connection-123" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/chats/conv-123"));
  });
  it("shows an error and does not navigate when the connection cannot open", async () => {
    open.mockRejectedValueOnce(new Error("Blocked"));
    render(<EnglishTestProvider><OpenDirectButton connectionId={"connection-123" as Id<"connections">} /></EnglishTestProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Message" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Couldn't open"));
    expect(push).not.toHaveBeenCalled();
  });
});
