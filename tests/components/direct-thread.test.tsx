import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { DirectThread } from "@/features/chats/direct-thread";
import { EnglishTestProvider } from "../helpers/intl";
import type { Id } from "../../convex/_generated/dataModel";

const sender = vi.fn(async (_value: unknown) => "msg-id");
const rows = [
  { _id: "m1", senderProfileId: "bob-id", body: "Hi from Bob", createdAt: 1000 },
  { _id: "m2", senderProfileId: "my-id", body: "Hello Bob", createdAt: 2000 },
];
vi.mock("convex/react", () => ({
  useMutation: () => sender,
  useQuery: () => ({ displayName: "Bob", handle: "bob" }),
  usePaginatedQuery: () => ({ results: rows, status: "Exhausted", loadMore: vi.fn() }),
}));
vi.stubGlobal("crypto", { randomUUID: () => "fixed-nonce-00000001" });

afterEach(() => { vi.clearAllMocks(); });

function renderThread() {
  return render(<EnglishTestProvider><DirectThread
    conversationId={"conversation-id" as Id<"conversations">}
    meProfileId={"my-id" as Id<"profiles">}
  /></EnglishTestProvider>);
}

describe("human direct thread", () => {
  it("renders real subscribed messages and sends trimmed text", async () => {
    renderThread();
    expect(screen.getByText("Hi from Bob")).toBeInTheDocument();
    expect(screen.getByText("Hello Bob")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("textbox", { name: "Message" }), { target: { value: "  How are you?  " } });
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));
    await waitFor(() => expect(sender).toHaveBeenCalledWith({
      conversationId: "conversation-id", body: "How are you?", clientNonce: "fixed-nonce-00000001",
    }));
    await waitFor(() => expect(screen.getByRole("textbox", { name: "Message" })).toHaveValue(""));
  });

  it("retains failed text and retries with the same nonce to avoid duplicates", async () => {
    sender.mockRejectedValueOnce(new Error("Offline"));
    renderThread();
    fireEvent.change(screen.getByRole("textbox", { name: "Message" }), { target: { value: "Retry this" } });
    fireEvent.click(screen.getByRole("button", { name: "Send message" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("try again"));
    expect(screen.getByRole("textbox", { name: "Message" })).toHaveValue("Retry this");
    fireEvent.click(screen.getByRole("button", { name: "Retry sending" }));
    await waitFor(() => expect(sender).toHaveBeenCalledTimes(2));
    expect(sender.mock.calls[0]?.[0]).toEqual(sender.mock.calls[1]?.[0]);
  });
});
