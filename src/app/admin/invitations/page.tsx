"use client";

import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import { MemberGate } from "@/components/access/member-gate";
import { AdminInvitationManager } from "@/features/invitations/admin-invitation-manager";

export default function OperatorInvitationsPage() {
  return <MemberGate operatorOnly>{() => <OperatorTools />}</MemberGate>;
}

function OperatorTools() {
  const invitations = useQuery(api.invites.list);
  const issue = useAction(api.invites.issue);
  const revoke = useMutation(api.invites.revoke);
  if (!invitations) return <p role="status">Loading invitation ledger…</p>;
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Private invitations</h1>
      <AdminInvitationManager
        invitations={invitations}
        appBaseUrl={process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}
        onCreateInvitation={issue}
        onRevokeInvitation={async (id) => { await revoke({ invitationId: id as Id<"invitations"> }); }}
      />
    </div>
  );
}
