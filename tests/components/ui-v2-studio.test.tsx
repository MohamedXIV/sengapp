import { beforeAll, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { VanillaMessenger } from "@/ui-v2/vanilla/messenger";

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
      dispatchEvent: vi.fn(),
    })),
  });
});

describe("Sengapp shadcn block reference", () => {
  it("displays the official block-inspired chat panel and sidebar", () => {
    render(<VanillaMessenger />);
    expect(screen.getByRole("heading", { name: "Dev Team" })).toBeInTheDocument();
    expect(screen.getByText(/Morning team!/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "New conversation" })).toBeInTheDocument();
  });

  it("selects mock conversations from sidebar-08", () => {
    render(<VanillaMessenger />);
    fireEvent.click(screen.getByRole("button", { name: /Sara Ali/ }));
    expect(screen.getByText("How does the new layout feel?")).toBeInTheDocument();
  });

  it("displays the native Empty state for a new conversation", () => {
    render(<VanillaMessenger />);
    fireEvent.click(screen.getByRole("button", { name: "New conversation" }));
    expect(screen.getByText("Start a conversation")).toBeInTheDocument();
  });

  it("sends only into local preview state through InputGroup", () => {
    render(<VanillaMessenger />);
    const input = screen.getByRole("textbox", { name: "Write a message" });
    fireEvent.change(input, { target: { value: "Plain demo message" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(screen.getByText("Plain demo message")).toBeInTheDocument();
    expect(input).toHaveValue("");
  });
});
