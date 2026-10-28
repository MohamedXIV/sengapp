"use client";

import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { MemberGate } from "@/components/access/member-gate";
import { CreateConnectionInvite } from "@/features/connections/create-connection-invite";
import { useTranslations } from "next-intl";

export default function ConnectionsPage() {
  return <MemberGate>{() => <ConnectionsSpace />}</MemberGate>;
}

function ConnectionsSpace() {
  const t = useTranslations("Connections");
  const nav = useTranslations("Navigation");
  const contacts = useQuery(api.connections.listMine);
  const invitations = useQuery(api.connectionInvites.listMine);
  const issue = useAction(api.connectionInvites.issue);
  const revoke = useMutation(api.connectionInvites.revoke);

  return <div className="space-y-8">
    <div className="space-y-2">
      <h1 className="text-3xl font-semibold">{nav("connections")}</h1>
      <p className="max-w-xl text-muted-foreground">
        {t("description")}
      </p>
    </div>
    <section className="space-y-3 rounded-xl border bg-card p-5">
      <h2 className="font-semibold">{t("yourContacts")}</h2>
      {contacts === undefined ? <p role="status">{t("loadingContacts")}</p>
        : contacts.length === 0 ? <p className="text-sm text-muted-foreground">
            {t("noContacts")}
          </p>
        : <ul className="space-y-3">
            {contacts.map((contact) => <li key={contact.connectionId} className="border-b pb-2">
              <span className="font-medium" dir="auto">{contact.displayName}</span>
              {contact.handle && <span className="ms-2 text-xs text-muted-foreground">@{contact.handle}</span>}
            </li>)}
          </ul>}
    </section>
    {invitations === undefined ? <p role="status">{t("loadingInvites")}</p>
      : <CreateConnectionInvite invitations={invitations} onIssue={issue}
          onRevoke={(invitationId) => revoke({ invitationId })} />}
  </div>;
}

