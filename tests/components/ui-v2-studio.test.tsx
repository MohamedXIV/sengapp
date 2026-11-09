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
    expect(screen.queryByRole("button", { name: "New conversation" })).not.toBeInTheDocument();
    expect(screen.getByTestId("floating-composer")).toBeInTheDocument();
  });

  it("selects mock conversations from sidebar-08", () => {
    render(<VanillaMessenger />);
    fireEvent.click(screen.getByRole("button", { name: /Sara Ali/ }));
    expect(screen.getByText("How does the new layout feel?")).toBeInTheDocument();
  });

  it("opens the shared right Sheet for appearance and companion settings", () => {
    render(<VanillaMessenger />);
    expect(screen.queryByRole("button", { name: "Name your companion" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Toggle preferences drawer" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Appearance", exact: true })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Companion" }));
    expect(screen.getByRole("form", { name: "Companion identity" })).toBeInTheDocument();
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
    fireEvent.click(screen.getByRole("button", { name: "Toggle preferences drawer" }));
    fireEvent.click(screen.getByRole("button", { name: "Companion" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Display name" }), { target: { value: "فراشة" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Mention alias" }), { target: { value: "farasha" } });
    fireEvent.click(screen.getByRole("button", { name: "Save companion" }));
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.getByText("AI companion · mock")).toBeInTheDocument();
    expect(screen.getByText(/no model or tool was run/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Approve preview" }));
    expect(screen.getByText("Approved locally · not executed")).toBeInTheDocument();
  });

  it("does not show companion output without mock consent", () => {
    render(<VanillaMessenger />);
    fireEvent.click(screen.getByRole("button", { name: "Toggle preferences drawer" }));
    fireEvent.click(screen.getByRole("button", { name: "Companion" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Display name" }), { target: { value: "Sparrow" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Mention alias" }), { target: { value: "sparrow" } });
    fireEvent.click(screen.getByRole("button", { name: "Save companion" }));
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    fireEvent.click(screen.getByRole("button", { name: /Sara Ali/ }));
    const input = screen.getByRole("textbox", { name: "Write a message" });
    fireEvent.change(input, { target: { value: "@sparrow can you help?" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(screen.getByText(/Companion request not activated/)).toBeInTheDocument();
    expect(screen.queryByText("AI companion · mock")).not.toBeInTheDocument();
  });

});
