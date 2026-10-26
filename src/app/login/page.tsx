"use client";

import { useState } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const available = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-5 p-6 text-center">
      <Link href="/" className="text-4xl" aria-label="Sengapp home">🐿️</Link>
      <h1 className="text-3xl font-semibold">Welcome back to Sengapp</h1>
      <p className="text-sm text-muted-foreground">
        A verified Google account starts a session. Sengapp membership still requires an invitation.
      </p>
      {error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      {!available && <p role="status" className="text-sm text-muted-foreground">
        Google sign-in will be available once the Convex deployment is configured.
      </p>}
      <button
        type="button"
        disabled={pending || !available}
        className="rounded-xl bg-primary px-4 py-3 font-medium text-primary-foreground disabled:opacity-50"
        onClick={async () => {
          setPending(true);
          setError(null);
          try {
            const invitePending = Boolean(sessionStorage.getItem("sengapp:pending-invite"));
            const result = await authClient.signIn.social({
              provider: "google",
              callbackURL: invitePending ? "/invite" : "/home",
            });
            if (result?.error) setError(result.error.message ?? "Sign-in failed.");
          } catch {
            setError("Could not start Google sign-in. Check the development configuration.");
          } finally {
            setPending(false);
          }
        }}
      >
        {pending ? "Connecting…" : "Continue with Google"}
      </button>
      <Link href="/invite" className="text-sm text-primary underline">
        Already have an invitation?
      </Link>
    </main>
  );
}
