import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SidebarQuickActions } from "@/components/layout/sidebar-quick-actions";
import { SidebarProvider } from "@/components/ui/sidebar";
import { EnglishTestProvider } from "../helpers/intl";

const updateUi = vi.fn(async (_value: unknown) => {});
const setTheme = vi.fn();
vi.mock("convex/react", () => ({ useMutation: () => updateUi }));
vi.mock("next-themes", () => ({ useTheme: () => ({ resolvedTheme: "light", theme: "system", setTheme }) }));
vi.mock("@/hooks/use-mobile", () => ({ useIsMobile: () => false }));

afterEach(() => { vi.clearAllMocks(); });

function renderActions() {
  const onSignOut = vi.fn();
  const result = render(<EnglishTestProvider><SidebarProvider>
    <SidebarQuickActions locale="en" onSignOut={onSignOut} />
  </SidebarProvider></EnglishTestProvider>);
  return { ...result, onSignOut };
}

describe("sidebar quick actions", () => {
  it("shows four accessible icons in one row and a settings link", async () => {
    const { container, onSignOut } = renderActions();
    const row = screen.getByLabelText("Quick account actions");
    expect(row).toHaveClass("grid-cols-4");
    expect(row.querySelectorAll("button, a")).toHaveLength(4);
    expect(screen.getByRole("link", { name: "Profile & privacy settings" })).toHaveAttribute("href", "/settings/profile");
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(onSignOut).toHaveBeenCalledOnce();
    expect(container.querySelectorAll("svg").length).toBeGreaterThanOrEqual(4);
  });

  it("keeps footer actions icon-only without persistent button tiles", () => {
    renderActions();
    const row = screen.getByLabelText("Quick account actions");
    const controls = row.querySelectorAll("button, a");
    expect(controls).toHaveLength(4);
    for (const control of controls) {
      expect(control).toHaveClass("border-0", "bg-transparent", "hover:bg-sidebar-accent", "focus-visible:ring-2");
      expect(control).not.toHaveClass("bg-sidebar-accent/40", "border-sidebar-border/70");
    }
    expect(screen.getByRole("link", { name: "Profile & privacy settings" }).querySelector(".lucide-settings")).toBeInTheDocument();
  });

  it("saves just the language or mode on the signed-in account", async () => {
    renderActions();
    fireEvent.click(screen.getByRole("button", { name: "Switch to Arabic" }));
    await waitFor(() => expect(updateUi).toHaveBeenCalledWith({ locale: "ar" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Turn on dark mode" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Turn on dark mode" }));
    await waitFor(() => expect(updateUi).toHaveBeenCalledWith({ themePreference: "dark" }));
    expect(setTheme).toHaveBeenCalledWith("dark");
  });

  it("reverts the optimistic mode change when persistence fails", async () => {
    updateUi.mockRejectedValueOnce(new Error("Offline"));
    renderActions();
    fireEvent.click(screen.getByRole("button", { name: "Turn on dark mode" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Couldn't save that change"));
    expect(setTheme).toHaveBeenCalledWith("dark");
    expect(setTheme).toHaveBeenLastCalledWith("system");
  });
});
