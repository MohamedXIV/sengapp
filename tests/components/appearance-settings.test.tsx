import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AppearanceSettings } from "@/features/profile/appearance-settings";
import { DEFAULT_VISUAL_PREFERENCES } from "@/lib/themes/preferences";
import { DEFAULT_WINDOW_STYLE } from "@/features/cottage/window-style";
import { EnglishTestProvider } from "../helpers/intl";

const setPreview = vi.fn();
const previewMode = vi.fn();
const cancelPreview = vi.fn();
vi.mock("@/components/themes/personal-theme-provider", () => ({
  usePersonalTheme: () => ({ setPreview, previewMode, cancelPreview }),
}));

afterEach(() => { vi.clearAllMocks(); });

describe("personal appearance settings", () => {
  it("reflects a new persisted light/dark choice made from the sidebar", () => {
    const initialPreferences = DEFAULT_VISUAL_PREFERENCES;
    const onSave = vi.fn(async () => {});
    const view = (mode: "light" | "dark") => <EnglishTestProvider><AppearanceSettings
      initialPreferences={initialPreferences} initialMode={mode} onSave={onSave}
    /></EnglishTestProvider>;
    const { rerender } = render(view("light"));
    expect(screen.getByRole("combobox", { name: "Light / dark" })).toHaveTextContent("Light");
    rerender(view("dark"));
    expect(screen.getByRole("combobox", { name: "Light / dark" })).toHaveTextContent("Dark");
  });

  it("previews a preset and accent before saving and sends one bounded payload", async () => {
    const onSave = vi.fn(async () => {});
    render(<EnglishTestProvider><AppearanceSettings initialPreferences={DEFAULT_VISUAL_PREFERENCES} initialMode="system" onSave={onSave} /></EnglishTestProvider>);
    fireEvent.click(screen.getByRole("button", { name: /Forest/i }));
    expect(setPreview).toHaveBeenLastCalledWith(expect.objectContaining({ preset: "forest" }));
    fireEvent.click(screen.getByRole("button", { name: /Violet accent/i }));
    expect(setPreview).toHaveBeenLastCalledWith(expect.objectContaining({ preset: "forest", accent: "violet" }));
    fireEvent.click(screen.getByRole("button", { name: "Save appearance" }));
    await waitFor(() => expect(onSave).toHaveBeenCalledWith({
      ...DEFAULT_VISUAL_PREFERENCES, preset: "forest", accent: "violet", themePreference: "system", windowStyle: DEFAULT_WINDOW_STYLE,
    }));
    expect(screen.getByText("Appearance saved for your account.")).toBeVisible();
  });

  it("cancel discards unsaved preview and reset previews safe defaults", () => {
    render(<EnglishTestProvider><AppearanceSettings initialPreferences={{ ...DEFAULT_VISUAL_PREFERENCES, preset: "ocean" }} initialMode="dark" onSave={vi.fn()} /></EnglishTestProvider>);
    fireEvent.click(screen.getByRole("button", { name: /Dusk/i }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel changes" }));
    expect(cancelPreview).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Reset to defaults" }));
    expect(setPreview).toHaveBeenLastCalledWith(DEFAULT_VISUAL_PREFERENCES);
  });

  it("sends theme and window material in ONE atomic save and cancels unsaved window previews", async () => {
    const onSave = vi.fn(async () => {});
    const onWindowPreview = vi.fn();
    const onWindowCommit = vi.fn();
    const { unmount } = render(<EnglishTestProvider><AppearanceSettings
      initialPreferences={DEFAULT_VISUAL_PREFERENCES} initialMode="light"
      initialWindowStyle={DEFAULT_WINDOW_STYLE} onSave={onSave}
      onWindowPreview={onWindowPreview} onWindowCommit={onWindowCommit}
    /></EnglishTestProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Glass" }));
    fireEvent.click(screen.getByRole("button", { name: "Rain" }));
    expect(onWindowPreview).toHaveBeenLastCalledWith(expect.objectContaining({
      material: "glass", atmosphere: "rain",
    }));
    expect(screen.getByTestId("window-material-preview")).toHaveAttribute("data-window-material", "glass");
    fireEvent.click(screen.getByRole("button", { name: "Save appearance" }));
    await waitFor(() => expect(onSave).toHaveBeenCalledOnce());
    expect(onSave).toHaveBeenCalledWith({
      ...DEFAULT_VISUAL_PREFERENCES, themePreference: "light",
      windowStyle: { ...DEFAULT_WINDOW_STYLE, material: "glass", opacity: 74, blur: 20, atmosphere: "rain" },
    });
    expect(onWindowCommit).toHaveBeenCalledWith(expect.objectContaining({ material: "glass" }));
    unmount();
    expect(onWindowPreview).toHaveBeenLastCalledWith(null);
  });

  it("restores saved appearance after a failed save", async () => {
    const onSave = vi.fn(async () => { throw new Error("Network failed"); });
    render(<EnglishTestProvider><AppearanceSettings initialPreferences={DEFAULT_VISUAL_PREFERENCES} initialMode="system" onSave={onSave} /></EnglishTestProvider>);
    fireEvent.click(screen.getByRole("button", { name: /Ocean/i }));
    fireEvent.click(screen.getByRole("button", { name: "Save appearance" }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Network failed"));
    expect(cancelPreview).toHaveBeenCalled();
  });
});
