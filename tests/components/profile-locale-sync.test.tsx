import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ProfileSettingsForm } from "@/features/profile/profile-settings-form";
import { EnglishTestProvider } from "../helpers/intl";

vi.stubGlobal("ResizeObserver", class {
  observe() {}
  unobserve() {}
  disconnect() {}
});

const identity = {
  displayName: "Squirrel", handle: "squirrel_1", bio: "", statusMessage: "",
  avatarPresetKey: "acorn-scout" as const, avatarAccentColor: "#C68A45",
  locale: "en" as const, textDirection: "auto" as const, reducedMotion: false,
};
const presence = { onlineStatus: true, lastSeen: true, readReceipts: true, typingIndicators: true };

describe("profile form and sidebar language preference", () => {
  it("submits the latest account locale after a footer language change without a second language control", async () => {
    const onSaveProfile = vi.fn(async () => {});
    const view = (locale: "en" | "ar") => <EnglishTestProvider><ProfileSettingsForm
      initialProfile={{ ...identity, locale }} initialPresence={presence}
      onSaveProfile={onSaveProfile} onSavePresence={vi.fn(async () => {})}
    /></EnglishTestProvider>;
    const { rerender } = render(view("en"));
    rerender(view("ar"));
    expect(screen.queryByLabelText("Preferred Language")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Save Profile Changes" }));
    await waitFor(() => expect(onSaveProfile).toHaveBeenCalledWith(expect.objectContaining({ locale: "ar" })));
  });
});
