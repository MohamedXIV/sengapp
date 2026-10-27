"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../../convex/_generated/api";

export function AcceptConnectionInvite({ code, onFinish }: { code: string; onFinish: () => void }) {
  const router = useRouter();
  const context = useQuery(api.connectionInvites.preview, { code });
  const accept = useMutation(api.connectionInvites.accept);
  const decline = useMutation(api.connectionInvites.decline);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (context === undefined) return <p role="status">Checking your invitation…</p>;
  if (!context.valid) return (
    <div className="space-y-4 rounded-xl border bg-card p-6">
      <h1 className="text-2xl font-semibold">Invitation unavailable</h1>
      <p className="text-sm text-muted-foreground">
        This link may have expired, been used, or may not be for your account.
        No connection was made.
      </p>
      <Link href="/connections" className="text-primary underline">Go to Connections</Link>
    </div>
  );

  async function decide(choice: "accept" | "decline") {
    if (busy) return;
    setBusy(true); setError("");
    try {
      if (choice === "accept") await accept({ code });
      else await decline({ code });
      onFinish();
      router.replace("/connections");
    } catch {
      setError("Couldn't complete that choice. The invitation may no longer be available.");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5 rounded-xl border bg-card p-6">
      <p className="text-sm font-semibold text-primary">Private connection invitation</p>
      <h1 className="text-2xl font-semibold">Connect with {context.senderDisplayName}?</h1>
      {context.note && <p className="rounded-lg bg-secondary p-3 text-sm" dir="auto">{context.note}</p>}
      <p className="text-sm text-muted-foreground">
        Accepting connects your profiles. It does not share your private conversations,
        messages, or personal AI companion.
      </p>
      <p className="text-xs text-muted-foreground">Expires {new Date(context.expiresAt).toLocaleString()}</p>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-3">
        <button type="button" disabled={busy} onClick={() => decide("accept")}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm text-primary-foreground disabled:opacity-60">
          {busy ? "Please wait…" : "Accept connection"}
        </button>
        <button type="button" disabled={busy} onClick={() => decide("decline")}
          className="rounded-lg border px-5 py-2.5 text-sm disabled:opacity-60">Decline</button>
      </div>
    </div>
  );
}
