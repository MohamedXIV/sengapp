import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
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

  it("shows a receipt only on the latest own message and only from consenting readers", () => {
    const messages = [
      { _id: "mine-2", senderProfileId: me, body: "Another hello", createdAt: 3000 },
      { _id: "other-1", senderProfileId: peer, body: "Hey", createdAt: 2000 },
      { _id: "mine-1", senderProfileId: me, body: "Hello", createdAt: 1000 },
    ] as Parameters<typeof ChatMessageTimeline>[0]["messages"];
    const reader = { profileId: peer, displayName: "Tala", readThroughAt: 3000 };
    const { rerender } = render(<EnglishTestProvider>
      <ChatMessageTimeline messages={messages} meProfileId={me} locale="en" readBy={[reader]} />
    </EnglishTestProvider>);
    expect(screen.getAllByText("Seen")).toHaveLength(1);
    rerender(<EnglishTestProvider>
      <ChatMessageTimeline messages={messages} meProfileId={me} locale="en"
        participantNames={{ [peer]: "Tala" }} readBy={[reader]} />
    </EnglishTestProvider>);
    expect(screen.getByText("Read by Tala")).toBeInTheDocument();
    rerender(<EnglishTestProvider>
      <ChatMessageTimeline messages={messages} meProfileId={me} locale="en" readBy={[]} />
    </EnglishTestProvider>);
    expect(screen.queryByText("Seen")).not.toBeInTheDocument();
  });

  it("renders live reply previews, edited markers and redacted deleted messages", () => {
    const messages = [
      { _id: "3", senderProfileId: me, body: "", deletedAt: 4000, createdAt: 3000 },
      { _id: "2", senderProfileId: peer, body: "I answered", createdAt: 2000,
        replyToMessageId: "1", replyPreview: { body: null, senderProfileId: null } },
      { _id: "1", senderProfileId: me, body: "Original", createdAt: 1000, editedAt: 1200 },
    ] as Parameters<typeof ChatMessageTimeline>[0]["messages"];
    render(<EnglishTestProvider>
      <ChatMessageTimeline messages={messages} meProfileId={me} locale="en" />
    </EnglishTestProvider>);
    expect(screen.getByText("Original message unavailable")).toBeInTheDocument();
    expect(screen.getByText("This message was deleted")).toBeInTheDocument();
    expect(screen.getByText("Edited")).toBeInTheDocument();
    expect(screen.getByText("I answered")).toBeInTheDocument();
  });

  it("keeps reactions accessible, counts them and toggles by emoji", () => {
    const onReact = vi.fn();
    const message = {
      _id: "1", senderProfileId: peer, body: "React here", createdAt: 1000,
      reactions: [{ profileId: me, emoji: "❤️" }, { profileId: peer, emoji: "❤️" }],
    } as Parameters<typeof ChatMessageTimeline>[0]["messages"][number];
    render(<EnglishTestProvider>
      <ChatMessageTimeline messages={[message]} meProfileId={me} locale="en"
        onReply={() => {}} onReact={onReact} />
    </EnglishTestProvider>);
    const reaction = screen.getByRole("button", { name: "❤️, 2 reactions" });
    expect(reaction).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(reaction);
    expect(onReact).toHaveBeenCalledWith(message, "❤️");
    expect(screen.getByRole("button", { name: "Message options" })).toBeVisible();
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
