import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { ChatMessageTimeline } from "@/features/chats/chat-message-timeline";
import { EnglishTestProvider } from "../helpers/intl";
import type { Id } from "../../convex/_generated/dataModel";

const me = "mine" as Id<"profiles">;
const peer = "other" as Id<"profiles">;

describe("cozy chat timeline", () => {
  it("shows dates, message ownership and group sender labels without mixing them up", () => {
    const messages = [
      { _id: "3", senderProfileId: me, body: "Mine", createdAt: Date.UTC(2026, 9, 30, 9, 0) },
      { _id: "2", senderProfileId: peer, body: "Another", createdAt: Date.UTC(2026, 9, 30, 8, 2) },
      { _id: "1", senderProfileId: peer, body: "First", createdAt: Date.UTC(2026, 9, 30, 8, 0) },
    ] as Parameters<typeof ChatMessageTimeline>[0]["messages"];
    render(<EnglishTestProvider><ChatMessageTimeline messages={messages} meProfileId={me}
      locale="en" participantNames={{ [peer]: "Tala" }} /></EnglishTestProvider>);
    const log = screen.getByRole("log", { name: "Conversation history" });
    expect(within(log).getAllByText(/First|Another|Mine/).map(el => el.textContent)).toEqual(["First", "Another", "Mine"]);
    expect(within(log).getAllByText("Tala")).toHaveLength(1);
    expect(within(log).getByText("Mine").closest("[data-message-owner]")).toHaveAttribute("data-message-owner", "self");
    expect(log.querySelectorAll("time")).toHaveLength(3);
    expect(log.querySelectorAll('[data-slot="marker"][data-variant="separator"]')).toHaveLength(1);
    expect(log.querySelectorAll('[data-slot="bubble"]')).toHaveLength(3);
  });

  it("renders day separators when the conversation spans different dates", () => {
    const messages = [
      { _id: "2", senderProfileId: peer, body: "Next morning", createdAt: Date.UTC(2026, 9, 30, 9) },
      { _id: "1", senderProfileId: peer, body: "Yesterday", createdAt: Date.UTC(2026, 9, 29, 9) },
    ] as Parameters<typeof ChatMessageTimeline>[0]["messages"];
    render(<EnglishTestProvider><ChatMessageTimeline messages={messages} meProfileId={me} locale="en" /></EnglishTestProvider>);
    expect(screen.getByText(/Oct 29, 2026/)).toBeInTheDocument();
    expect(screen.getByText(/Oct 30, 2026/)).toBeInTheDocument();
  });
});
