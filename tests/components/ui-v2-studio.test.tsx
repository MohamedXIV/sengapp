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
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

describe("UI v2 vanilla shadcn baseline", () => {
  it("shows a sample chat without a live backend", () => {
    render(<VanillaMessenger />);
    expect(screen.getByRole("heading", { name: "Dev Team" })).toBeInTheDocument();
    expect(screen.getByText(/Morning team!/)).toBeInTheDocument();
    expect(screen.getByText("Sample conversations only")).toBeInTheDocument();
  });

  it("switches local conversations", () => {
    render(<VanillaMessenger />);
    fireEvent.click(screen.getByRole("button", { name: /Sara Ali/ }));
    expect(screen.getByText("How does the new layout feel?")).toBeInTheDocument();
  });

  it("uses InputGroup for a local-only send", () => {
    render(<VanillaMessenger />);
    const input = screen.getByRole("textbox", { name: "Write a message" });
    fireEvent.change(input, { target: { value: "A plain demo message" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(screen.getByText("A plain demo message")).toBeInTheDocument();
    expect(input).toHaveValue("");
  });
});
