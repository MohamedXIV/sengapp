import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("UI v2 clean-room architectural boundary", () => {
  it("does not import existing app UI, backend hooks or global legacy styles", () => {
    const component = readFileSync("src/ui-v2/studio/studio.tsx", "utf8");
    const route = readFileSync("src/app/ui-v2/page.tsx", "utf8");
    const css = readFileSync("src/ui-v2/studio/studio.css", "utf8");
    const uiImports = [...component.matchAll(/from ["'](@\/components\/[^"']+)["']/g)].map(match => match[1]);
    expect(uiImports.length).toBeGreaterThan(0);
    expect(uiImports.every(path => path?.startsWith("@/components/ui/") === true)).toBe(true);
    expect(component).not.toMatch(/@\/features\/|convex\/|@clerk\//);
    expect(route).not.toMatch(/@\/components\/|@\/features\/|convex\/|@clerk\//);
    expect(css).not.toMatch(/\.cottage-|\.sengapp-workspace|\.dv-|\.dockview-|glassmorphism/);
    expect(component).toContain("demoConversations");
    for (const primitive of ["button", "input", "textarea", "avatar", "toggle-group", "scroll-area", "dialog"]) {
      expect(component).toContain(`@/components/ui/${primitive}`);
    }
    expect(route).toContain("SengappStudio");
  });
});


describe("native sidebar-08 composition", () => {
  it("uses official inset/offcanvas primitives and never its old manual collapse system", () => {
    const studio = readFileSync("src/ui-v2/studio/studio.tsx", "utf8");
    const sidebar = readFileSync("src/ui-v2/studio/app-sidebar.tsx", "utf8");
    expect(studio).toContain("<SidebarProvider");
    expect(studio).toContain("<SidebarInset");
    expect(studio).toContain("<SidebarTrigger");
    expect(sidebar).toContain('variant="inset" collapsible="offcanvas"');
    expect(sidebar).toContain("<SidebarHeader");
    expect(sidebar).toContain("<SidebarContent");
    expect(sidebar).toContain("<SidebarFooter");
    expect(sidebar).toContain("<Collapsible");
    expect(sidebar).toContain("<DropdownMenu");
    expect(studio).not.toContain("setNavOpen");
    expect(studio).not.toContain("s2-navigation");
  });
});
