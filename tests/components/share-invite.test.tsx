import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CreateConnectionInvite } from "../../src/features/connections/create-connection-invite";

const code = "A".repeat(43);
const issue = vi.fn(async () => ({ code, expiresAt: Date.now() + 86_400_000 }));
const props = { invitations: [], onIssue: issue, onRevoke: vi.fn(async () => {}) };

afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); });

describe("Connection invite copy and native sharing", () => {
  it("lets someone create one invitation and copy it without minting more tokens", async () => {
    const writeText = vi.fn(async () => {});
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    render(<CreateConnectionInvite {...props} />);
    fireEvent.click(screen.getByRole("button", { name: /Create invitation link/i }));
    const link = await screen.findByLabelText("Invitation link");
    expect((link as HTMLInputElement).value).toContain("/invite#code=" + code);
    fireEvent.click(screen.getByRole("button", { name: /Copy link/i }));
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(issue).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("status").textContent).toContain("Copied");
    expect(screen.queryByRole("button", { name: /Share/i })).toBeNull();
  });

  it("keeps the link selectable when clipboard access is denied", async () => {
    vi.stubGlobal("navigator", { clipboard: { writeText: vi.fn(async () => { throw new Error("denied"); }) } });
    render(<CreateConnectionInvite {...props} />);
    fireEvent.click(screen.getByRole("button", { name: /Create invitation link/i }));
    const link = await screen.findByLabelText("Invitation link");
    fireEvent.click(screen.getByRole("button", { name: /Copy link/i }));
    await waitFor(() => expect(screen.getByRole("status").textContent).toMatch(/manually/i));
    expect(link).toBeInTheDocument();
    expect(issue).toHaveBeenCalledTimes(1);
  });

  it("does not claim delivery if the native sharing chooser is canceled", async () => {
    const share = vi.fn(async () => { throw new DOMException("Canceled", "AbortError"); });
    vi.stubGlobal("navigator", { share, clipboard: { writeText: vi.fn() } });
    render(<CreateConnectionInvite {...props} />);
    fireEvent.click(screen.getByRole("button", { name: /Create invitation link/i }));
    await screen.findByLabelText("Invitation link");
    fireEvent.click(screen.getByRole("button", { name: /Share/i }));
    await waitFor(() => expect(share).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("status").textContent).toMatch(/canceled/i);
    expect(screen.getByLabelText("Invitation link")).toBeInTheDocument();
    expect(issue).toHaveBeenCalledTimes(1);
  });
});
