import { afterEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { PersonalThemeProvider, usePersonalTheme } from "@/components/themes/personal-theme-provider";
import { DEFAULT_VISUAL_PREFERENCES } from "@/lib/themes/preferences";
import { DEFAULT_WINDOW_STYLE } from "@/features/cottage/window-style";

const setTheme = vi.fn();
vi.mock("next-themes", () => ({ useTheme: () => ({ resolvedTheme: "light", setTheme }) }));

const unmounts: Array<() => void> = [];
function ThemeActions() {
  const { setPreview, setWindowStylePreview } = usePersonalTheme();
  return <>
    <button onClick={() => setPreview({ ...DEFAULT_VISUAL_PREFERENCES, preset: "dusk" })}>Preview dusk</button>
    <button onClick={() => setWindowStylePreview({ ...DEFAULT_WINDOW_STYLE, material: "retro" })}>Preview retro</button>
  </>;
}

function mount(profileId: string, preferences = DEFAULT_VISUAL_PREFERENCES) {
  const node = document.createElement("div");
  document.body.append(node);
  const root = createRoot(node);
  const render = (id: string, prefs = DEFAULT_VISUAL_PREFERENCES) => {
    act(() => root.render(<PersonalThemeProvider key={id} profileId={id} preferences={prefs} appearance="system">
      <ThemeActions />
    </PersonalThemeProvider>));
  };
  render(profileId, preferences);
  unmounts.push(() => { act(() => root.unmount()); node.remove(); });
  return { node, render };
}

afterEach(() => {
  while (unmounts.length) unmounts.pop()?.();
  vi.clearAllMocks();
});

describe("account-aware personal theme", () => {
  it("previews only in current session and clears on sign-out", () => {
    const { node } = mount("alice");
    expect(document.documentElement.dataset.sengappTheme).toBe("acorn");
    expect(document.documentElement.dataset.sengappSkin).toBe("paper");
    const buttons = node.querySelectorAll("button");
    act(() => buttons[0].click());
    act(() => buttons[1].click());
    expect(document.documentElement.dataset.sengappTheme).toBe("dusk");
    expect(document.documentElement.dataset.sengappSkin).toBe("retro");
    act(() => unmounts.pop()?.());
    expect(document.documentElement.dataset.sengappTheme).toBeUndefined();
    expect(document.documentElement.dataset.sengappSkin).toBeUndefined();
    expect(document.documentElement.style.getPropertyValue("--background")).toBe("");
  });

  it("does not carry Alice's preview into Bob's account", () => {
    const { node, render } = mount("alice");
    act(() => (node.querySelector("button") as HTMLButtonElement).click());
    render("bob", { ...DEFAULT_VISUAL_PREFERENCES, preset: "forest" });
    expect(document.documentElement.dataset.sengappTheme).toBe("forest");
    expect(document.documentElement.dataset.sengappSkin).toBe("paper");
  });
});
