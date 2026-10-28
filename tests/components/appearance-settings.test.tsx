import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AppearanceSettings } from "@/features/profile/appearance-settings";
import { DEFAULT_VISUAL_PREFERENCES } from "@/lib/themes/preferences";
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
      ...DEFAULT_VISUAL_PREFERENCES, preset: "forest", accent: "violet", themePreference: "system",
    }));
    expect(screen.getByRole("status")).toHaveTextContent("saved");
  });

  it("cancel discards unsaved preview and reset previews safe defaults", () => {
    render(<EnglishTestProvider><AppearanceSettings initialPreferences={{ ...DEFAULT_VISUAL_PREFERENCES, preset: "ocean" }} initialMode="dark" onSave={vi.fn()} /></EnglishTestProvider>);
    fireEvent.click(screen.getByRole("button", { name: /Dusk/i }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel changes" }));
    expect(cancelPreview).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Reset to defaults" }));
    expect(setPreview).toHaveBeenLastCalledWith(DEFAULT_VISUAL_PREFERENCES);
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
