"use client";

import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { MemberGate } from "@/components/access/member-gate";
import { CreateConnectionInvite } from "@/features/connections/create-connection-invite";

export default function ConnectionsPage() {
  return <MemberGate>{() => <ConnectionsSpace />}</MemberGate>;
}

function ConnectionsSpace() {
  const contacts = useQuery(api.connections.listMine);
  const invitations = useQuery(api.connectionInvites.listMine);
  const issue = useAction(api.connectionInvites.issue);
  const revoke = useMutation(api.connectionInvites.revoke);

  return <div className="space-y-8">
    <div className="space-y-2">
      <h1 className="text-3xl font-semibold">Connections</h1>
      <p className="max-w-xl text-muted-foreground">
        Your social circle is private. Invite someone to connect whenever you&apos;re ready.
        There is no public people directory.
      </p>
    </div>
    <section className="space-y-3 rounded-xl border bg-card p-5">
      <h2 className="font-semibold">Your contacts</h2>
      {contacts === undefined ? <p role="status">Loading your contacts…</p>
        : contacts.length === 0 ? <p className="text-sm text-muted-foreground">
            No connections yet — that&apos;s completely fine. Your personal profile works on its own.
          </p>
        : <ul className="space-y-3">
            {contacts.map((contact) => <li key={contact.connectionId} className="border-b pb-2">
              <span className="font-medium" dir="auto">{contact.displayName}</span>
              {contact.handle && <span className="ms-2 text-xs text-muted-foreground">@{contact.handle}</span>}
            </li>)}
          </ul>}
    </section>
    {invitations === undefined ? <p role="status">Loading invitations…</p>
      : <CreateConnectionInvite invitations={invitations} onIssue={issue}
          onRevoke={(invitationId) => revoke({ invitationId })} />}
  </div>;
}
