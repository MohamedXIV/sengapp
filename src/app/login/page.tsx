"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { SignIn } from "@clerk/nextjs";

const subscribeToStorage = (onChange: () => void) => {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
};

export default function LoginPage() {
  const pendingInvite = useSyncExternalStore(
    subscribeToStorage,
    () => Boolean(sessionStorage.getItem("sengapp:pending-invite")),
    () => false,
  );
  const configured = Boolean(
    process.env.NEXT_PUBLIC_CONVEX_URL && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  );

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-5 p-6 text-center">
      <Link href="/" className="text-4xl" aria-label="Sengapp home">🐿️</Link>
      <h1 className="text-3xl font-semibold">Welcome to Sengapp</h1>
      <p className="text-sm text-muted-foreground">
        Sign in or create an account with your verified email. You can join without any invitation.
      </p>
      {configured
        ? <SignIn
            routing="hash"
            withSignUp
            fallbackRedirectUrl={pendingInvite ? "/invite" : "/home"}
            signUpFallbackRedirectUrl={pendingInvite ? "/invite" : "/home"}
          />
        : <p role="status" className="text-sm text-muted-foreground">
            Sign-in will be available once Clerk and Convex are configured.
          </p>}
      <Link href="/invite" className="text-sm text-primary underline">Have a connection invitation?</Link>
    </main>
  );
}

