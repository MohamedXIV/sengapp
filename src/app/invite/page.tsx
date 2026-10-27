"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useConvexAuth } from "convex/react";
import { BackendRequired, MemberGate } from "@/components/access/member-gate";
import { AcceptConnectionInvite } from "@/features/connections/accept-connection-invite";

const INVITE_STORAGE_KEY = "sengapp:pending-invite";

export default function InvitePage() {
  return <div className="mx-auto min-h-screen max-w-xl p-6 pt-16">
    <BackendRequired><InviteEntry /></BackendRequired>
  </div>;
}

function InviteEntry() {
  const [code, setCode] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const fromLink = fragment.get("code");
    if (fromLink) {
      sessionStorage.setItem(INVITE_STORAGE_KEY, fromLink);
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    setCode(fromLink ?? sessionStorage.getItem(INVITE_STORAGE_KEY));
    setReady(true);
  }, []);
  if (!ready) return <p role="status">Opening connection invitation…</p>;
  if (!code) return (
    <div className="space-y-4 rounded-xl border bg-card p-6">
      <h1 className="text-2xl font-semibold">No invitation link</h1>
      <p className="text-sm text-muted-foreground">
        Ask a friend to share a connection invitation link with you.
        You can create your own Sengapp account without one.
      </p>
      <Link href="/login" className="text-primary underline">Sign in or join</Link>
    </div>
  );
  return <ConnectionEntry code={code} />;
}

function ConnectionEntry({ code }: { code: string }) {
  const { isLoading, isAuthenticated } = useConvexAuth();
  if (isLoading) return <p role="status">Checking your sign-in…</p>;
  if (!isAuthenticated) return (
    <div className="space-y-4 rounded-xl border bg-card p-6">
      <h1 className="text-2xl font-semibold">Someone wants to connect</h1>
      <p className="text-sm text-muted-foreground">
        Sign in or create a verified account first. The invitation will wait;
        opening it never automatically accepts it.
      </p>
      <Link href="/login" className="inline-flex rounded-lg bg-primary px-5 py-3 text-primary-foreground">
        Sign in to decide
      </Link>
    </div>
  );
  return (
    <MemberGate>{() => <AcceptConnectionInvite code={code}
      onFinish={() => sessionStorage.removeItem(INVITE_STORAGE_KEY)} />}</MemberGate>
  );
}
