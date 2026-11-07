import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { VanillaMessenger } from "@/ui-v2/vanilla/messenger";

beforeEach(() => {
  const matchMedia = (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
  });
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: matchMedia,
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
  it("renders the mock companion within the same conversation and keeps approvals local", () => {
    render(<VanillaMessenger />);
    expect(screen.getByText("AI companion · mock")).toBeInTheDocument();
    expect(screen.getByText(/No model or tool was run/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Approve preview" }));
    expect(screen.getByText("Approved locally · not executed")).toBeInTheDocument();
  });

  it("does not show companion output without mock consent", () => {
    render(<VanillaMessenger />);
    fireEvent.click(screen.getByRole("button", { name: /Sara Ali/ }));
    const input = screen.getByRole("textbox", { name: "Write a message" });
    fireEvent.change(input, { target: { value: "@Milo can you help?" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(screen.getByText(/Companion request not activated/)).toBeInTheDocument();
    expect(screen.queryByText("AI companion · mock")).not.toBeInTheDocument();
  });

});
