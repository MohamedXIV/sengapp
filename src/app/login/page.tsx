"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  const [pendingInvite, setPendingInvite] = useState(false);
  const configured = Boolean(
    process.env.NEXT_PUBLIC_CONVEX_URL && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  );

  useEffect(() => {
    setPendingInvite(Boolean(sessionStorage.getItem("sengapp:pending-invite")));
  }, []);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-5 p-6 text-center">
      <Link href="/" className="text-4xl" aria-label="Sengapp home">🐿️</Link>
      <h1 className="text-3xl font-semibold">Welcome to Sengapp</h1>
      <p className="text-sm text-muted-foreground">
        Sign in or create an account with Clerk. Joining the Sengapp lounge still requires an invitation.
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
      <Link href="/invite" className="text-sm text-primary underline">Already have an invitation?</Link>
    </main>
  );
}
