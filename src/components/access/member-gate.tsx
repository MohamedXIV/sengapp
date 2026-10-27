"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";
import { AppShell } from "@/components/layout/app-shell";

type Profile = Doc<"profiles">;

export function BackendRequired({ children }: { children: ReactNode }) {
  if (!process.env.NEXT_PUBLIC_CONVEX_URL || !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return (
      <div role="status" className="mx-auto max-w-lg rounded-2xl border bg-card p-6 text-center">
        <h1 className="text-xl font-semibold">Sengapp needs its Clerk and Convex connection</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Set up the development environment in docs/development.md to unlock sign-in and invitations.
        </p>
        <Link href="/" className="mt-4 inline-block text-primary underline">Back to welcome</Link>
      </div>
    );
  }
  return <>{children}</>;
}

export function MemberGate({
  children,
  operatorOnly = false,
}: {
  children: (profile: Profile) => ReactNode;
  operatorOnly?: boolean;
}) {
  return (
    <BackendRequired>
      <AuthenticatedMember operatorOnly={operatorOnly}>{children}</AuthenticatedMember>
    </BackendRequired>
  );
}

function AuthenticatedMember({
  children,
  operatorOnly,
}: {
  children: (profile: Profile) => ReactNode;
  operatorOnly: boolean;
}) {
  const { isLoading, isAuthenticated } = useConvexAuth();
  if (isLoading) return <p role="status" className="p-8">Checking your session…</p>;
  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-md space-y-4 p-8 text-center">
        <h1 className="text-2xl font-semibold">Your space is private</h1>
        <p className="text-muted-foreground">Sign in with your verified account first.</p>
        <Link href="/login" className="inline-flex rounded-lg bg-primary px-5 py-3 text-primary-foreground">Sign in</Link>
      </div>
    );
  }
  return <ResolvedMembership operatorOnly={operatorOnly}>{children}</ResolvedMembership>;
}

function ResolvedMembership({
  children,
  operatorOnly,
}: {
  children: (profile: Profile) => ReactNode;
  operatorOnly: boolean;
}) {
  const profile = useQuery(api.profiles.getMine);
  const ensureMine = useMutation(api.profiles.ensureMine);
  const bootstrap = useMutation(api.profiles.bootstrapOperator);
  const [setupState, setSetupState] = useState<"idle" | "creating" | "failed">("idle");
  const [setupError, setSetupError] = useState<string>("");

  useEffect(() => {
    if (profile !== null || setupState !== "idle") return;
    setSetupState("creating");
    void ensureMine({}).catch((error: unknown) => {
      const value = String(error);
      setSetupError(value.includes("SUSPENDED")
        ? "This account is suspended. Contact the Sengapp operator."
        : value.includes("VERIFIED_SIGN_IN_REQUIRED")
          ? "Verify your email address with Clerk and sign in again."
          : "We couldn't prepare your private space. Please try again.");
      setSetupState("failed");
    });
  }, [ensureMine, profile, setupState]);

  if (profile === undefined) return <p role="status" className="p-8">Loading your space…</p>;
  if (!profile) {
    return (
      <div className="mx-auto max-w-md space-y-4 p-8 text-center">
        <h1 className="text-2xl font-semibold">Preparing your private space</h1>
        {setupState !== "failed"
          ? <p role="status" className="text-sm text-muted-foreground">Creating your Sengapp profile…</p>
          : <>
              <p role="alert" className="text-sm text-destructive">{setupError}</p>
              <button type="button" className="rounded-lg border px-4 py-2"
                onClick={() => setSetupState("idle")}>Try again</button>
            </>}
      </div>
    );
  }
  if (operatorOnly && profile.role !== "operator") {
    return (
      <div className="mx-auto max-w-md space-y-4 p-8 text-center">
        <h1 className="text-2xl font-semibold">Operator access</h1>
        <p role="alert">This page requires an operator account.</p>
        <OperatorBootstrap bootstrap={() => bootstrap({})} />
        <Link href="/home" className="inline-block text-primary underline">Back to your space</Link>
      </div>
    );
  }
  return (
    <AppShell userRole={profile.role} displayName={profile.displayName}
      handle={profile.handle ?? "new-member"} locale={profile.locale}
      textDirection={profile.textDirection}>
      {children(profile)}
    </AppShell>
  );
}

function OperatorBootstrap({ bootstrap }: { bootstrap: () => Promise<unknown> }) {
  const [state, setState] = useState<string | null>(null);
  return (
    <div className="border-t pt-4 text-xs text-muted-foreground">
      <p>Designated operator? Initialize your verified operator account.</p>
      <button type="button" className="mt-2 underline" onClick={async () => {
        try {
          await bootstrap();
          setState("Operator membership initialized.");
        } catch {
          setState("This account is not authorized as an operator.");
        }
      }}>Initialize operator</button>
      {state && <p role="status" className="mt-2">{state}</p>}
    </div>
  );
}
