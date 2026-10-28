"use client";

import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { MemberGate } from "@/components/access/member-gate";
import { CreateConnectionInvite } from "@/features/connections/create-connection-invite";
import { ContactsPanel } from "@/features/connections/contacts-panel";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Heart } from "lucide-react";

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

  return <div className="space-y-7">
    <div className="sengapp-section-intro space-y-3 rounded-[calc(var(--radius)+0.5rem)] border border-border/60 p-6 sm:p-8">
      <Badge variant="secondary" className="w-fit gap-1.5 rounded-full px-3 py-1"><Heart aria-hidden="true" className="size-3" />{t("circle")}</Badge>
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{nav("connections")}</h1>
      <p className="max-w-2xl text-sm leading-7 text-muted-foreground">{t("description")}</p>
    </div>
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
      <ContactsPanel contacts={contacts} />
      {invitations === undefined ? <p role="status" className="text-sm text-muted-foreground">{t("loadingInvites")}</p>
        : <CreateConnectionInvite invitations={invitations} onIssue={issue}
            onRevoke={(invitationId) => revoke({ invitationId })} />}
    </div>
  </div>;
}

