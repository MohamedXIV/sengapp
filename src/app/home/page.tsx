"use client";

import Link from "next/link";
import { MemberGate } from "@/components/access/member-gate";

export default function MemberHomePage() {
  return (
    <MemberGate>
      {(profile) => (
        <div className="space-y-5">
          <div className="text-4xl" aria-hidden="true">🌿</div>
          <h1 className="text-3xl font-semibold">Good to see you, {profile.displayName}!</h1>
          <p className="max-w-lg text-muted-foreground">
            This is your private Sengapp lounge. Conversations and companions arrive in the next phases.
            Your profile is ready, even without any contacts. Your conversations remain private until you connect.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link className="rounded-xl bg-primary px-4 py-3 text-sm text-primary-foreground" href="/settings/profile">
              Edit your profile
            </Link>
            {profile.role === "operator" && (
              <Link className="rounded-xl border px-4 py-3 text-sm" href="/admin/invitations">
                Manage invitations
              </Link>
            )}
          </div>
        </div>
      )}
    </MemberGate>
  );
}
