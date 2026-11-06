import { afterEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { SengappStudio } from "@/ui-v2/studio/studio";

afterEach(() => {
  window.localStorage.removeItem("sengapp-v2-clean-room-appearance");
});

describe("Sengapp UI v2 isolated reference", () => {
  it("renders the reference conversation without authentication or a backend", () => {
    render(<SengappStudio />);
    expect(screen.getByRole("heading", { name: "Conversations" })).toBeInTheDocument();
    expect(screen.getByText(/Example conversations, not live messages/)).toBeInTheDocument();
    expect(screen.getByText(/Morning team!/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show chat details" })).toBeInTheDocument();
  });

  it("filters sample conversations and selects one", () => {
    render(<SengappStudio />);
    fireEvent.change(screen.getByRole("textbox", { name: "Search conversations" }), { target: { value: "Sara Ali" } });
    expect(screen.getByText("Sara Ali")).toBeInTheDocument();
    expect(screen.queryByText("Youssef")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Sara Ali"));
    expect(screen.getByText("I put together some ideas for the new chat layout.")).toBeInTheDocument();
  });

  it("adds a mock message to local state and allows a reply", () => {
    render(<SengappStudio />);
    const input = screen.getByRole("textbox", { name: "Write a message" });
    fireEvent.change(input, { target: { value: "Local design checkpoint" } });
    fireEvent.click(screen.getByRole("button", { name: "Add message to local demo" }));
    expect(screen.getByText("Local design checkpoint")).toBeInTheDocument();
    expect(screen.getByText(/no message was sent/i)).toBeInTheDocument();
  });

  it("opens optional details and applies bounded appearance choices", () => {
    const { container } = render(<SengappStudio />);
    fireEvent.click(screen.getByRole("button", { name: "Show chat details" }));
    expect(screen.getByRole("complementary", { name: "Conversation details" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Close details" }));
    expect(screen.queryByRole("complementary", { name: "Conversation details" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Appearance" }));
    fireEvent.click(screen.getByRole("button", { name: "Plum" }));
    expect(container.querySelector(".s2-root")).toHaveAttribute("data-accent", "plum");
    fireEvent.click(screen.getByRole("button", { name: "Reset appearance" }));
    expect(container.querySelector(".s2-root")).toHaveAttribute("data-accent", "sage");
  });
});
