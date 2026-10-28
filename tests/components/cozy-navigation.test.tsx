import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { getNavigationSide, isNavigationItemActive } from "@/components/layout/navigation";
import { Sidebar, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { SidebarDismissLink } from "@/components/layout/app-shell";

let mobile = false;
vi.mock("@/hooks/use-mobile", () => ({ useIsMobile: () => mobile }));

afterEach(() => { mobile = false; });

describe("cozy navigation", () => {
  it("places Arabic and English menus on the intended physical side", () => {
    expect(getNavigationSide("ar")).toBe("right");
    expect(getNavigationSide("en")).toBe("left");
  });

  it("highlights the exact route, including the appearance anchor, without false positives", () => {
    expect(isNavigationItemActive("/home", "/home")).toBe(true);
    expect(isNavigationItemActive("/connections", "/connections")).toBe(true);
    expect(isNavigationItemActive("/connections-other", "/connections")).toBe(false);
    expect(isNavigationItemActive("/settings/profile", "/settings/profile#appearance")).toBe(false);
    expect(isNavigationItemActive("/unknown", "/home")).toBe(false);
  });

  it("keeps the floating desktop sidebar explicitly on the right in RTL", () => {
    mobile = false;
    const { container } = render(<SidebarProvider><Sidebar dir="rtl" side="right" variant="floating">Navigation</Sidebar></SidebarProvider>);
    const sidebar = container.querySelector('[data-variant="floating"]');
    expect(sidebar).toHaveAttribute("data-side", "right");
    expect(sidebar).toHaveAttribute("dir", "rtl");
    expect(sidebar?.querySelector('[data-sidebar="sidebar"]')).toBeInTheDocument();
    expect(sidebar?.querySelector(".fixed")).toHaveClass("group-data-[side=right]:right-0");
  });

  it("uses a physical right-side Sheet on Arabic phones", () => {
    mobile = true;
    render(<SidebarProvider><SidebarTrigger aria-label="Show navigation" /><Sidebar dir="rtl" side="right" mobileTitle="قائمة التنقل">Navigation</Sidebar></SidebarProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Show navigation" }));
    const drawer = document.querySelector('[data-mobile="true"]');
    expect(drawer).toHaveAttribute("dir", "rtl");
    expect(drawer).toHaveClass("right-0");
    expect(drawer).not.toHaveClass("end-0");
    expect(drawer).not.toHaveClass("[&>button]:hidden");
    expect(screen.getByText("قائمة التنقل")).toBeInTheDocument();
  });

  it("dismisses the mobile drawer after a sidebar action link is selected", () => {
    mobile = true;
    render(<SidebarProvider><SidebarTrigger aria-label="Show menu" />
      <Sidebar side="right" dir="rtl"><SidebarDismissLink href="/settings/profile">Settings</SidebarDismissLink></Sidebar>
    </SidebarProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Show menu" }));
    expect(document.querySelector('[data-mobile="true"]')).toHaveAttribute("data-state", "open");
    fireEvent.click(screen.getByRole("link", { name: "Settings" }));
    // Radix may unmount the closed Sheet immediately rather than retain a closed node.
    expect(document.querySelector('[data-mobile="true"]')?.getAttribute("data-state") ?? "closed").toBe("closed");
  });
});
