import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { CozyHome } from "@/components/home/cozy-home";
import { EnglishTestProvider } from "../helpers/intl";

describe("cozy member home", () => {
  it("greets the member and points to the now-available private conversations", () => {
    render(<EnglishTestProvider><CozyHome name="Alex" operator={false} /></EnglishTestProvider>);
    expect(screen.getByRole("heading", { name: /Alex/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Invite a friend/ })).toHaveAttribute("href", "/connections");
    expect(screen.getByRole("link", { name: /Edit profile/ })).toHaveAttribute("href", "/settings/profile");
    expect(screen.queryByRole("link", { name: /chat|message|companion/i })).not.toBeInTheDocument();
    expect(screen.getByText(/private conversations are ready/i)).toBeInTheDocument();
  });

  it("keeps real actions visible for operators without duplicating buttons", () => {
    render(<EnglishTestProvider><CozyHome name="Sam" operator /></EnglishTestProvider>);
    expect(screen.getAllByRole("link", { name: /Invite a friend/ })).toHaveLength(1);
    expect(screen.getAllByRole("link", { name: /Edit profile/ })).toHaveLength(1);
  });
});
