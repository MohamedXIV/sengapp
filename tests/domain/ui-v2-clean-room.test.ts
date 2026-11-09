import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("Sengapp UI v2: shared shadcn Classic and Cozy shells", () => {
  const page = read("src/app/ui-v2/page.tsx");
  const entry = read("src/ui-v2/vanilla/messenger.tsx");
  const state = read("src/ui-v2/shared/workspace-state.tsx");
  const chat = read("src/ui-v2/shared/conversation-panel.tsx");
  const appearance = read("src/ui-v2/shared/appearance-panel.tsx");
  const drawer = read("src/ui-v2/shared/appearance-drawer.tsx");
  const companion = read("src/ui-v2/shared/companion-settings-panel.tsx");
  const classic = read("src/ui-v2/classic/classic-shell.tsx");
  const cozy = read("src/ui-v2/cozy/cozy-shell.tsx");
  const mobile = read("src/ui-v2/cozy/mobile-windows.tsx");
  const timeline = read("src/ui-v2/vanilla/timeline.tsx");
  const composer = read("src/ui-v2/vanilla/composer.tsx");
  const sidebar = read("src/ui-v2/vanilla/sidebar-08/app-sidebar.tsx");

  it("isolates the new shells from the legacy app and actual Convex/Clerk backends", () => {
    expect(existsSync("src/ui-v2/studio/studio.css")).toBe(false);
    expect(existsSync("src/ui-v2/studio/studio.tsx")).toBe(false);
    for (const file of [page, entry, state, chat, appearance, classic, cozy, mobile, timeline, composer]) {
      expect(file).not.toMatch(/s2-|SengappStudio|convex\/|@clerk\//i);
    }
    expect(page).toContain("shadcn-theme.css");
    expect(page).toContain("dockview-react/dist/styles/dockview.css");
  });

  it("uses the original shadcn sidebar-08 composition for Classic", () => {
    expect(classic).toContain("<AppSidebar");
    expect(classic).toContain("<SidebarProvider");
    expect(sidebar).toContain('variant="inset" collapsible="offcanvas"');
    for (const item of ["nav-main", "nav-projects", "nav-secondary", "nav-user"]) {
      expect(sidebar).toContain("./" + item);
    }
  });

  it("renders ONE shared conversation component in both shells", () => {
    expect(classic).toContain("<SharedConversationPanel");
    expect(cozy).toContain("<SharedConversationPanel");
    expect(mobile).toContain("<SharedConversationPanel");
    expect(chat).toContain("<Card");
    expect(chat).toContain("<VanillaTimeline");
    expect(chat).toContain("<VanillaComposer");
    for (const component of ["bubble", "message", "message-scroller", "marker"]) {
      expect(timeline).toContain("@/components/ui/" + component);
    }
    expect(composer).toContain("@/components/ui/input-group");
    expect(composer).toContain("<InputGroupTextarea");
    expect(composer).toContain("<InputGroupAddon");
    expect(timeline).not.toContain("style=");
    expect(composer).not.toContain("style=");
  });

  it("keeps user-named agent messages and consent mocks in the shared state", () => {
    const data = read("src/ui-v2/vanilla/data.ts");
    const activity = read("src/ui-v2/vanilla/agent-activity.tsx");
    expect(data).toContain('kind?: "person" | "agent" | "notice"');
    expect(data).toContain("exampleAgentConsent");
    expect(activity).toContain("@/components/ui/trace");
    expect(activity).toContain("@/components/ui/item");
    expect(timeline).toContain("AgentActivity");
    expect(composer).toContain("Mention a companion");
    expect(state).toContain("exampleAgentConsent[selectedId]");
    expect(state).toContain("saveCompanion");
    expect(state).not.toMatch(/@ai-sdk\/react|useChat\(|convex\/|@clerk\//);
  });

  it("keeps headers minimal, a floating shadcn composer, and companion identity in the right Sheet", () => {
    expect(chat).toContain("conversation-header");
    expect(chat).toContain("floating-composer");
    expect(chat).not.toContain("Name your companion");
    expect(chat).not.toContain("New conversation");
    expect(companion).toContain("saveCompanion");
    expect(drawer).toContain("CompanionSettingsPanel");
    expect(drawer).toContain("<Sheet");
    expect(drawer).not.toContain("<aside");
    expect(mobile).toContain("openRightPanel");
  });

  it("places Dockview windows over the real Phaser room, not a separate app", () => {
    expect(cozy).toContain("DockviewReact");
    expect(cozy).toContain("floating:");
    expect(cozy).toContain("<RoomCanvas");
    expect(cozy).toContain("windowBounds");
    expect(mobile).toContain("onPointerDown");
    expect(mobile).toContain("Resize chat window");
  });

  it("shares editable colors, corners and shadows via scoped tokens", () => {
    const theme = read("src/ui-v2/vanilla/shadcn-theme.css");
    expect(theme).toContain("body:has([data-sengapp-shadcn-blocks])");
    expect(theme).toContain('data-accent="rose"');
    expect(theme).toContain('data-corners="round"');
    expect(theme).toContain('data-shadow="deep"');
    expect(theme).not.toContain(".s2-");
    expect(appearance).toContain("updateAppearance");
    expect(state).toContain("sengapp-ui-v2-appearance-v1");
  });
});
