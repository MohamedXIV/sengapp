import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import LoginPage from "@/app/login/page";
import { EnglishTestProvider } from "../helpers/intl";

// Verify Clerk receives the intended post-auth routes without requiring live credentials.
vi.mock("@clerk/nextjs", () => ({
  SignIn: ({ fallbackRedirectUrl, signUpFallbackRedirectUrl }: {
    fallbackRedirectUrl: string;
    signUpFallbackRedirectUrl: string;
  }) => <div data-testid="clerk-sign-in" data-redirect={fallbackRedirectUrl}
    data-signup-redirect={signUpFallbackRedirectUrl} />,
}));

beforeEach(() => {
  sessionStorage.clear();
  vi.stubEnv("NEXT_PUBLIC_CONVEX_URL", "https://unit-test.convex.cloud");
  vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "pk_test_placeholder");
});

afterEach(() => {
  vi.unstubAllEnvs();
  sessionStorage.clear();
});

function renderLogin() {
  render(<EnglishTestProvider><LoginPage /></EnglishTestProvider>);
  return screen.getByTestId("clerk-sign-in");
}

describe("Clerk direct-login destination", () => {
  it("returns ordinary sign-in and sign-up to the canonical cozy home", () => {
    const signIn = renderLogin();
    expect(signIn).toHaveAttribute("data-redirect", "/");
    expect(signIn).toHaveAttribute("data-signup-redirect", "/");
  });

  it("resumes an unfinished connection invitation instead of dropping it", () => {
    sessionStorage.setItem("sengapp:pending-invite", "test-invite-code");
    const signIn = renderLogin();
    expect(signIn).toHaveAttribute("data-redirect", "/invite");
    expect(signIn).toHaveAttribute("data-signup-redirect", "/invite");
  });
});
