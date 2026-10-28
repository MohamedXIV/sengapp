import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ContactsPanel } from "@/features/connections/contacts-panel";
import { EnglishTestProvider } from "../helpers/intl";

describe("private contacts panel", () => {
  it("uses a friendly empty state without inventing contacts", () => {
    render(<EnglishTestProvider><ContactsPanel contacts={[]} /></EnglishTestProvider>);
    expect(screen.getByText(/no connections yet/i)).toBeInTheDocument();
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  });

  it("lists only actual connected profiles and preserves mixed-script handles", () => {
    const contacts = [{ connectionId: "con-1", displayName: "ندى", handle: "nada_7" }];
    render(<EnglishTestProvider><ContactsPanel contacts={contacts} /></EnglishTestProvider>);
    expect(screen.getByText("ندى")).toHaveAttribute("dir", "auto");
    expect(screen.getByText("@nada_7")).toHaveAttribute("dir", "ltr");
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
  });

  it("reports loading without implying that an empty circle was fetched", () => {
    render(<EnglishTestProvider><ContactsPanel contacts={undefined} /></EnglishTestProvider>);
    expect(screen.getByRole("status")).toHaveTextContent(/loading/i);
    expect(screen.queryByText(/no connections yet/i)).not.toBeInTheDocument();
  });
});
