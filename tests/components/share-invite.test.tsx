import { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createRoot } from "react-dom/client";
import { CreateConnectionInvite } from "../../src/features/connections/create-connection-invite";
import type { Id } from "../../convex/_generated/dataModel";
import { EnglishTestProvider } from "../helpers/intl";

const code = "A".repeat(43);
const issue = vi.fn(async () => ({ code, invitationId: "test-invite" as Id<"connectionInvites">, expiresAt: Date.now() + 86_400_000 }));
const props = { invitations: [], onIssue: issue, onRevoke: vi.fn(async () => {}) };
const unmounts: Array<() => void> = [];
function renderFixture() {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => { root.render(<EnglishTestProvider><CreateConnectionInvite {...props} /></EnglishTestProvider>); });
  unmounts.push(() => { root.unmount(); container.remove(); });
  return container;
}

function button(container: HTMLElement, label: string) {
  const found = Array.from(container.querySelectorAll("button"))
    .find((element) => element.textContent?.includes(label));
  if (!found) throw new Error("Missing button: " + label);
  return found;
}
function linkInput(container: HTMLElement) {
  const found = container.querySelector<HTMLInputElement>('input[aria-label="Invitation link"]');
  if (!found) throw new Error("Invitation link was not rendered");
  return found;
}
async function create(container: HTMLElement) {
  await act(async () => { button(container, "Create invitation link").click(); });
}

afterEach(() => {
  act(() => { while (unmounts.length) unmounts.pop()?.(); });
  vi.unstubAllGlobals(); vi.clearAllMocks();
});

describe("Connection invite copy and native sharing", () => {
  it("lets someone create one invitation and copy it without minting more tokens", async () => {
    const writeText = vi.fn(async () => {});
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    const container = renderFixture();
    await create(container);
    expect(linkInput(container).value).toContain("/invite#code=" + code);
    await act(async () => { button(container, "Copy link").click(); });
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(issue).toHaveBeenCalledTimes(1);
    expect(container.querySelector('[role="status"]')?.textContent).toContain("Copied");
    expect(container.textContent).not.toContain("Share…");
  });

  it("keeps the link selectable when clipboard access is denied", async () => {
    vi.stubGlobal("navigator", { clipboard: { writeText: vi.fn(async () => { throw new Error("denied"); }) } });
    const container = renderFixture();
    await create(container);
    const link = linkInput(container);
    await act(async () => { button(container, "Copy link").click(); });
    expect(container.querySelector('[role="status"]')?.textContent).toMatch(/manually/i);
    expect(document.activeElement).toBe(link);
    expect(issue).toHaveBeenCalledTimes(1);
  });

  it("does not claim delivery if the native sharing chooser is canceled", async () => {
    const share = vi.fn(async () => { throw new DOMException("Canceled", "AbortError"); });
    vi.stubGlobal("navigator", { share, clipboard: { writeText: vi.fn() } });
    const container = renderFixture();
    await create(container);
    await act(async () => { button(container, "Share…").click(); });
    expect(share).toHaveBeenCalledTimes(1);
    expect(container.querySelector('[role="status"]')?.textContent).toMatch(/canceled/i);
    expect(linkInput(container).value).toContain(code);
    expect(issue).toHaveBeenCalledTimes(1);
  });
  it("removes the issued link and consumed invite from the sender view after acceptance", async () => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    const invitationId = "connection-test-invite" as Id<"connectionInvites">;
    const expiresAt = Date.now() + 86_400_000;
    const issueWithId = vi.fn(async () => ({ code, invitationId, expiresAt }));
    const pendingInvite = {
      _id: invitationId, codeHint: "••••AAAA", status: "pending" as const,
      createdAt: Date.now(), expiresAt,
    };
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    const onRevoke = vi.fn(async () => {});
    unmounts.push(() => { root.unmount(); container.remove(); });

    act(() => {
      root.render(<EnglishTestProvider><CreateConnectionInvite invitations={[]} onIssue={issueWithId} onRevoke={onRevoke} /></EnglishTestProvider>);
    });
    await create(container);
    expect(linkInput(container).value).toContain(code);

    act(() => {
      root.render(<EnglishTestProvider><CreateConnectionInvite invitations={[pendingInvite]} onIssue={issueWithId} onRevoke={onRevoke} /></EnglishTestProvider>);
    });
    expect(linkInput(container).value).toContain(code);
    expect(container.textContent).toContain("••••AAAA");

    await act(async () => {
      root.render(<EnglishTestProvider><CreateConnectionInvite
        invitations={[{ ...pendingInvite, status: "accepted" }]}
        onIssue={issueWithId} onRevoke={onRevoke} /></EnglishTestProvider>);
    });
    expect(container.querySelector('input[aria-label="Invitation link"]')).toBeNull();
    expect(container.textContent).not.toContain("••••AAAA");
    expect(container.textContent).not.toContain("· accepted");
  });

});

