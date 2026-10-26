"use client";

import React, { useState } from "react";
import { createInvitationSchema } from "@/lib/validations/invitation";

export interface InvitationListItem {
  _id: string;
  codeHint: string;
  recipientEmail?: string;
  note?: string;
  status: "pending" | "redeemed" | "revoked";
  expiresAt: number;
  createdAt: number;
}

interface AdminInvitationManagerProps {
  invitations: InvitationListItem[];
  appBaseUrl: string;
  onCreateInvitation: (input: {
    recipientEmail?: string;
    note?: string;
    ttlHours: number;
  }) => Promise<{ code: string; expiresAt: number }>;
  onRevokeInvitation: (invitationId: string) => Promise<void>;
}

export function AdminInvitationManager({
  invitations,
  appBaseUrl,
  onCreateInvitation,
  onRevokeInvitation,
}: AdminInvitationManagerProps) {
  const [invitedEmail, setInvitedEmail] = useState("");
  const [note, setNote] = useState("");
  const [expiresInHours, setExpiresInHours] = useState(72);
  const [newlyGeneratedLink, setNewlyGeneratedLink] = useState<string | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNewlyGeneratedLink(null);

    const parsed = createInvitationSchema.safeParse({
      invitedEmail,
      note,
      expiresInHours,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid invitation parameters.");
      return;
    }

    setIsCreating(true);
    try {
      const result = await onCreateInvitation({
        recipientEmail: parsed.data.invitedEmail || undefined,
        note: parsed.data.note || undefined,
        ttlHours: parsed.data.expiresInHours,
      });

      const cleanBase = appBaseUrl.replace(/\/$/, "");
      setNewlyGeneratedLink(`${cleanBase}/invite#code=${encodeURIComponent(result.code)}`);
      setInvitedEmail("");
      setNote("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create invitation."
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-8">
      <form
        onSubmit={handleCreate}
        className="p-6 rounded-xl border border-border bg-card space-y-4 shadow-sm"
      >
        <div>
          <h2 className="text-lg font-semibold">Generate One-Time Invitation</h2>
          <p className="text-sm text-muted-foreground">
            Only the SHA-256 hash is stored in Convex. Copy the link immediately
            after generating.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="p-3 rounded-lg bg-destructive/10 border border-destructive text-destructive text-xs"
          >
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label htmlFor="invitedEmail" className="text-sm font-medium block">
              Restrict to Email (Optional)
            </label>
            <input
              id="invitedEmail"
              type="email"
              value={invitedEmail}
              onChange={(e) => setInvitedEmail(e.target.value)}
              placeholder="friend@example.com"
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="inviteNote" className="text-sm font-medium block">
              Operator Note
            </label>
            <input
              id="inviteNote"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Cousin Omar — family group"
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="expiresInHours"
              className="text-sm font-medium block"
            >
              Expires In
            </label>
            <select
              id="expiresInHours"
              value={expiresInHours}
              onChange={(e) => setExpiresInHours(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
            >
              <option value={24}>24 hours</option>
              <option value={72}>3 days (72 hours)</option>
              <option value={168}>7 days</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={isCreating}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
        >
          {isCreating ? "Generating..." : "Create Invitation Token"}
        </button>

        {newlyGeneratedLink && (
          <div
            role="status"
            className="p-4 rounded-lg border border-primary/40 bg-accent text-accent-foreground space-y-2"
          >
            <p className="text-xs font-semibold uppercase tracking-wider">
              One-Time Invitation Link (Shown Only Once)
            </p>
            <code className="block p-2 rounded bg-background text-foreground text-xs break-all">
              {newlyGeneratedLink}
            </code>
            <button type="button" className="rounded-lg bg-primary px-3 py-2 text-xs text-primary-foreground"
              onClick={async () => {
                await navigator.clipboard.writeText(newlyGeneratedLink);
              }}>Copy invitation link</button>
          </div>
        )}
      </form>

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-sm">Invitation Ledger</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-start">
            <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-start">Token Hint</th>
                <th className="px-4 py-3 text-start">Bound Email</th>
                <th className="px-4 py-3 text-start">Note</th>
                <th className="px-4 py-3 text-start">Status</th>
                <th className="px-4 py-3 text-start">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invitations.map((inv) => (
                <tr key={inv._id}>
                  <td className="px-4 py-3 font-mono text-xs">
                    {inv.codeHint}
                  </td>
                  <td className="px-4 py-3">{inv.recipientEmail ?? "Any"}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {inv.note ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-secondary">
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {inv.status === "pending" && (
                      <button
                        type="button"
                        onClick={() => onRevokeInvitation(inv._id)}
                        className="text-xs text-destructive hover:underline"
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
