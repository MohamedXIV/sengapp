"use client";

import React, { useState } from "react";
import { redeemInvitationSchema } from "@/lib/validations/invitation";

interface InviteRedemptionCardProps {
  rawToken: string;
  tokenVerification?:
    | { valid: true; expiresAt: number; restrictedToEmail: boolean }
    | { valid: false; reason: string; message: string };
  onRedeem: (payload: {
    rawToken: string;
    displayName: string;
    handle: string;
    locale: "en" | "ar";
  }) => Promise<void>;
}

export function InviteRedemptionCard({
  rawToken,
  tokenVerification,
  onRedeem,
}: InviteRedemptionCardProps) {
  const [displayName, setDisplayName] = useState("");
  const [handle, setHandle] = useState("");
  const [locale, setLocale] = useState<"en" | "ar">("en");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (tokenVerification && !tokenVerification.valid) {
    return (
      <div
        role="alert"
        className="max-w-md mx-auto p-6 rounded-2xl border border-destructive/40 bg-card shadow-sm space-y-3 text-center"
      >
        <div className="text-3xl" aria-hidden="true">
          🍂
        </div>
        <h1 className="text-xl font-semibold">Invitation Unavailable</h1>
        <p className="text-sm text-muted-foreground">
          {tokenVerification.message}
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsed = redeemInvitationSchema.safeParse({
      rawToken,
      displayName,
      handle,
      locale,
    });

    if (!parsed.success) {
      setError(
        parsed.error.issues[0]?.message ?? "Please check your onboarding details."
      );
      return;
    }

    setSubmitting(true);
    try {
      await onRedeem(parsed.data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to redeem invitation."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 rounded-2xl border border-border bg-card shadow-sm space-y-5">
      <div className="space-y-1">
        <span className="inline-block text-xs font-medium px-2.5 py-1 rounded-full bg-accent text-accent-foreground">
          Personal Invitation
        </span>
        <h1 className="text-2xl font-semibold pt-1">Welcome to Sengapp</h1>
        <p className="text-sm text-muted-foreground">
          A little place for big conversations. Set up your personal profile to
          accept this one-time invitation.
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

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="invite-displayName" className="text-sm font-medium">
            Your Name
          </label>
          <input
            id="invite-displayName"
            type="text"
            dir="auto"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Nour / نور"
            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="invite-handle" className="text-sm font-medium">
            Handle
          </label>
          <input
            id="invite-handle"
            type="text"
            dir="ltr"
            required
            value={handle}
            onChange={(e) => setHandle(e.target.value.toLowerCase())}
            placeholder="nour_squirrel"
            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="invite-locale" className="text-sm font-medium">
            Interface Language
          </label>
          <select
            id="invite-locale"
            value={locale}
            onChange={(e) => setLocale(e.target.value as "en" | "ar")}
            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
          >
            <option value="en">English</option>
            <option value="ar">العربية</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-95 disabled:opacity-50"
        >
          {submitting ? "Activating Membership..." : "Redeem Invitation & Enter"}
        </button>
      </form>
    </div>
  );
}
