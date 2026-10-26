"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useConvexAuth, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../../convex/_generated/api";
import { BackendRequired } from "@/components/access/member-gate";
import { InviteRedemptionCard } from "@/features/invitations/invite-redemption-card";

const INVITE_STORAGE_KEY = "sengapp:pending-invite";

export default function InvitePage() {
  return <main className="mx-auto min-h-screen max-w-xl p-6 pt-16">
    <BackendRequired><InviteEntry /></BackendRequired>
  </main>;
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
  if (!ready) return <p role="status">Opening invitation…</p>;
  if (!code) return (
    <div className="space-y-4 rounded-xl border bg-card p-6">
      <h1 className="text-2xl font-semibold">Redeem your invitation</h1>
      <p className="text-muted-foreground">Open the invitation link sent by your Sengapp operator.</p>
      <Link href="/" className="text-primary underline">Return home</Link>
    </div>
  );
  return <RedeemWhenAuthenticated code={code} />;
}

function RedeemWhenAuthenticated({ code }: { code: string }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  if (isLoading) return <p role="status">Checking your sign-in…</p>;
  if (!isAuthenticated) return (
    <div className="space-y-4 rounded-xl border bg-card p-6 text-center">
      <h1 className="text-2xl font-semibold">Almost home!</h1>
      <p className="text-sm text-muted-foreground">Sign in with a verified Google account to use this invitation.</p>
      <Link href="/login" className="inline-flex rounded-lg bg-primary px-5 py-3 text-primary-foreground">
        Sign in to redeem
      </Link>
    </div>
  );
  return <RedeemForm code={code} />;
}

function RedeemForm({ code }: { code: string }) {
  const router = useRouter();
  const redeem = useMutation(api.invites.redeem);
  return <InviteRedemptionCard rawToken={code} onRedeem={async (input) => {
    await redeem({
      code: input.rawToken, displayName: input.displayName,
      handle: input.handle, locale: input.locale,
    });
    sessionStorage.removeItem(INVITE_STORAGE_KEY);
    router.replace("/home");
  }} />;
}
