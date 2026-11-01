import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { WorkspaceAuthEntry } from "@/features/cottage/workspace-auth-entry";
import { EnglishTestProvider } from "../helpers/intl";

const auth = vi.hoisted(() => ({ signedIn: false }));

// Core 3 exports Show, not SignedOut. A legacy import will fail this render test.
vi.mock("@clerk/nextjs", () => ({
  Show: ({ when, children }: { when: string; children: React.ReactNode }) =>
    when === "signed-out" && !auth.signedIn ? <>{children}</> : null,
  SignInButton: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

beforeEach(() => {
  auth.signedIn = false;
  sessionStorage.clear();
  vi.stubEnv("NEXT_PUBLIC_CONVEX_URL", "https://unit-test.convex.cloud");
  vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "pk_test_placeholder");
});

afterEach(() => {
  vi.unstubAllEnvs();
  sessionStorage.clear();
});

function renderEntry() {
  return render(<EnglishTestProvider><WorkspaceAuthEntry /></EnglishTestProvider>);
}

describe("Cozy home Clerk Core 3 auth entry", () => {
  it("renders a modal sign-in button for signed-out visitors", () => {
    renderEntry();
    expect(screen.getByRole("button", { name: "Sign in or join" })).toBeVisible();
  });

  it("hides the signed-out control from signed-in people", () => {
    auth.signedIn = true;
    renderEntry();
    expect(screen.queryByRole("button", { name: "Sign in or join" })).not.toBeInTheDocument();
  });

  it("preserves the direct-login fallback for a pending invitation", () => {
    sessionStorage.setItem("sengapp:pending-invite", "test-invite");
    renderEntry();
    expect(screen.getByRole("link", { name: "Sign in or join" })).toHaveAttribute("href", "/login");
  });

  it("keeps sign-in reachable when backend configuration is absent", () => {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "");
    renderEntry();
    expect(screen.getByRole("link", { name: "Sign in or join" })).toHaveAttribute("href", "/login");
  });
});
