import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardTitle } from "@/components/ui/card";

describe("shadcn/ui foundation", () => {
  it("renders an accessible disabled button from the shared component", () => {
    render(<Button disabled>Saving…</Button>);
    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
  });

  it("uses real shared input and card primitives", () => {
    render(
      <Card>
        <CardTitle>Profile settings</CardTitle>
        <Input aria-label="Display name" defaultValue="Alice" />
      </Card>,
    );
    expect(screen.getByRole("textbox", { name: "Display name" })).toHaveValue("Alice");
    expect(screen.getByText("Profile settings")).toBeInTheDocument();
  });
});
