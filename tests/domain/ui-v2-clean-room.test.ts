import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("UI v2 clean-room architectural boundary", () => {
  it("does not import existing app UI, backend hooks or global legacy styles", () => {
    const component = readFileSync("src/ui-v2/studio/studio.tsx", "utf8");
    const route = readFileSync("src/app/ui-v2/page.tsx", "utf8");
    const css = readFileSync("src/ui-v2/studio/studio.css", "utf8");
    expect(component).not.toMatch(/@\/components\/|@\/features\/|convex\/|@clerk\//);
    expect(route).not.toMatch(/@\/components\/|@\/features\/|convex\/|@clerk\//);
    expect(css).not.toMatch(/\.cottage-|\.sengapp-workspace|\.dv-|\.dockview-|glassmorphism/);
    expect(component).toContain("demoConversations");
    expect(route).toContain("SengappStudio");
  });
});
