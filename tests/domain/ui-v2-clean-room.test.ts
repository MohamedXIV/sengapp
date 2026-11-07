import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("UI v2 vanilla clean-room boundary", () => {
  const route = readFileSync("src/app/ui-v2/page.tsx", "utf8");
  const messenger = readFileSync("src/ui-v2/vanilla/messenger.tsx", "utf8");
  const timeline = readFileSync("src/ui-v2/vanilla/timeline.tsx", "utf8");
  const composer = readFileSync("src/ui-v2/vanilla/composer.tsx", "utf8");

  it("deletes the former studio rather than layering styles over it", () => {
    expect(route).toContain("VanillaMessenger");
    expect(route).not.toContain("studio.css");
    expect(existsSync("src/ui-v2/studio/studio.tsx")).toBe(false);
    expect(existsSync("src/ui-v2/studio/studio.css")).toBe(false);
    for (const file of [route, messenger, timeline, composer]) {
      expect(file).not.toMatch(/s2-|SengappStudio|appearance|@\/features\/|convex\/|@clerk\//i);
    }
  });

  it("composes the real shadcn chat primitives with no added cosmetic styling", () => {
    for (const name of ["message", "bubble", "message-scroller", "marker"]) {
      expect(timeline).toContain("@/components/ui/" + name);
    }
    expect(messenger).toContain('variant="inset" collapsible="offcanvas"');
    expect(composer).toContain("@/components/ui/input-group");
    for (const primitive of ["Message", "Bubble", "BubbleContent", "MessageScroller", "MessageScrollerViewport"]) {
      expect(timeline).toContain("<" + primitive);
    }
    expect(timeline).not.toContain("className=");
    expect(composer).not.toContain("className=");
    expect(messenger).not.toContain("style=");
  });
});
