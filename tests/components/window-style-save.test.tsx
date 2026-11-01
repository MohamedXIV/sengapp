import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { WindowStylePanel } from "@/features/cottage/window-style-panel";
import { DEFAULT_WINDOW_STYLE } from "@/features/cottage/window-style";
import { EnglishTestProvider } from "../helpers/intl";

describe("account window style save boundary", () => {
  it("previews material changes but never writes to server without an explicit save", async () => {
    const changed = vi.fn();
    const save = vi.fn().mockResolvedValue(undefined);
    render(<EnglishTestProvider>
      <WindowStylePanel value={DEFAULT_WINDOW_STYLE} onChange={changed}
        canSaveAccount onSaveAccount={save} />
    </EnglishTestProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Glass" }));
    expect(changed).toHaveBeenCalledWith({ ...DEFAULT_WINDOW_STYLE, material: "glass" });
    expect(save).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /Save to my account/i }));
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("does not offer account writes for signed-out guests", () => {
    const changed = vi.fn();
    render(<EnglishTestProvider>
      <WindowStylePanel value={DEFAULT_WINDOW_STYLE} onChange={changed} />
    </EnglishTestProvider>);
    expect(screen.queryByRole("button", { name: /Save to my account/i })).not.toBeInTheDocument();
    expect(screen.getByText(/Saved to this browser only/)).toBeInTheDocument();
  });
});
