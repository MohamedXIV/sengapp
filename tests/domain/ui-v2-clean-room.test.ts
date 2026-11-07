import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("UI v2 shadcn block first isolation", () => {
  const page = readFileSync("src/app/ui-v2/page.tsx", "utf8");
  const shell = readFileSync("src/ui-v2/vanilla/messenger.tsx", "utf8");
  const timeline = readFileSync("src/ui-v2/vanilla/timeline.tsx", "utf8");
  const composer = readFileSync("src/ui-v2/vanilla/composer.tsx", "utf8");
  const sidebar = readFileSync("src/ui-v2/vanilla/sidebar-08/app-sidebar.tsx", "utf8");

  it("does not reuse the rejected design studio or backend", () => {
    expect(existsSync("src/ui-v2/studio/studio.css")).toBe(false);
    expect(existsSync("src/ui-v2/studio/studio.tsx")).toBe(false);
    for (const file of [page, shell, timeline, composer, sidebar]) {
      expect(file).not.toMatch(/s2-|SengappStudio|@\/features\/|convex\/|@clerk\//i);
    }
    expect(page).toContain("shadcn-theme.css");
  });

  it("uses the whole sidebar-08 source composition", () => {
    expect(sidebar).toContain('variant="inset" collapsible="offcanvas"');
    for (const file of ["nav-main", "nav-projects", "nav-secondary", "nav-user"]) {
      expect(sidebar).toContain("./" + file);
      expect(existsSync("src/ui-v2/vanilla/sidebar-08/" + file + ".tsx")).toBe(true);
    }
  });

  it("uses the official Chat Demo and Group Chat component parts", () => {
    expect(shell).toContain("<Card");
    expect(shell).toContain("<CardHeader");
    expect(shell).toContain("<CardContent");
    expect(shell).toContain("<CardFooter");
    expect(shell).toContain("<Empty");
    for (const component of ["bubble", "message", "message-scroller", "marker"]) {
      expect(timeline).toContain("@/components/ui/" + component);
    }
    expect(composer).toContain("@/components/ui/input-group");
    expect(composer).toContain("<InputGroupTextarea");
    expect(composer).toContain("<InputGroupAddon");
    expect(timeline).not.toContain("style=");
    expect(composer).not.toContain("style=");
  });

  it("scopes one stock theme to the demo and never targets individual components", () => {
    const theme = readFileSync("src/ui-v2/vanilla/shadcn-theme.css", "utf8");
    expect(theme).toContain("body:has([data-sengapp-shadcn-blocks])");
    expect(theme).not.toContain(".s2-");
    expect(theme).not.toContain("[data-slot=");
  });
});
