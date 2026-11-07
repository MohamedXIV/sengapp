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
    const timeline = readFileSync("src/ui-v2/studio/message-timeline.tsx", "utf8");
    const composer = readFileSync("src/ui-v2/studio/message-composer.tsx", "utf8");
    const inputGroup = readFileSync("src/components/ui/input-group.tsx", "utf8");
    const presentation = component + timeline + composer;
    for (const primitive of ["button", "input", "avatar", "toggle-group", "dialog", "toggle", "dropdown-menu", "input-group", "popover", "bubble", "message", "message-scroller", "marker"]) {
      expect(presentation).toContain(`@/components/ui/${primitive}`);
    }
    expect(inputGroup).toContain('from "@/components/ui/textarea"');
    const scroller = readFileSync("src/components/ui/message-scroller.tsx", "utf8");
    const bubble = readFileSync("src/components/ui/bubble.tsx", "utf8");
    expect(scroller).toContain('@shadcn/react/message-scroller');
    expect(timeline).toContain('<MessageScrollerProvider');
    expect(timeline).toContain('<MessageScrollerItem');
    expect(timeline).toContain('<BubbleReactions');
    expect(timeline).not.toContain('<Card');
    expect(timeline).not.toContain('scrollIntoView');
    expect(bubble).toContain("bubbleVariants");
    for (const file of [timeline, composer]) {
      expect(file).not.toContain("@/features/");
      expect(file).not.toContain("convex/");
      expect(file).not.toContain("@clerk/");
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
