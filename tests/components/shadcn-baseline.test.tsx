import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

  it("renders an accessible AlertDialog with accessible role and labels", () => {
    render(
      <AlertDialog open>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm action</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>,
    );
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Confirm action" })).toBeInTheDocument();
    expect(screen.getByText("This action cannot be undone.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toBeInTheDocument();
  });
});

