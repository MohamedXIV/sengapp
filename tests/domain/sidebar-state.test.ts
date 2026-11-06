import { describe, expect, it } from "vitest";
import { readSidebarState } from "@/components/layout/sidebar-state";

describe("Classic icon-first navigation", () => {
  it("uses the icon-first default on new devices and invalid cookies", () => {
    expect(readSidebarState("")).toBeNull();
    expect(readSidebarState("sidebar_state=unsupported")).toBeNull();
    expect(readSidebarState("session=abc")).toBeNull();
  });

  it("restores expanded/collapsed layout across routes without account mutations", () => {
    expect(readSidebarState("foo=1; sidebar_state=true; other=x")).toBe(true);
    expect(readSidebarState("foo=1; sidebar_state=false")).toBe(false);
  });
});
