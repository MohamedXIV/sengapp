import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SengappStudio } from "@/ui-v2/studio/studio";

beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((media: string) => ({
      matches: false,
      media,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

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
    expect(screen.getByRole("dialog", { name: "Appearance" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: "Plum" }));
    expect(container.querySelector(".s2-root")).toHaveAttribute("data-accent", "plum");
    fireEvent.click(screen.getByRole("button", { name: "Reset appearance" }));
    expect(container.querySelector(".s2-root")).toHaveAttribute("data-accent", "sage");
  });
  it("restores saved appearance before writing defaults to browser storage", async () => {
    const saved = { accent: "plum", corners: "soft", elevation: "soft", density: "comfortable", mode: "dark" };
    window.localStorage.setItem("sengapp-v2-clean-room-appearance", JSON.stringify(saved));
    const { container } = render(<SengappStudio />);
    await waitFor(() => expect(container.querySelector(".s2-root")).toHaveAttribute("data-mode", "dark"));
    expect(container.querySelector(".s2-root")).toHaveAttribute("data-accent", "plum");
    expect(JSON.parse(window.localStorage.getItem("sengapp-v2-clean-room-appearance") ?? "null")).toEqual(saved);
  });

  it("renders shadcn message action menus and composer controls", () => {
    render(<SengappStudio />);
    expect(screen.getByRole("button", { name: "Message actions: d1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Choose emoji" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Attach file (demo)" }));
    expect(screen.getByText(/Attachments will be connected/)).toBeInTheDocument();
  });

});
