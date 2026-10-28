"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function GroupInvitations() {
  const t = useTranslations("Chats");
  const router = useRouter();
  const invites = useQuery(api.groups.listInvitesMine);
  const accept = useMutation(api.groups.acceptInvite);
  const decline = useMutation(api.groups.declineInvite);
  const [busy, setBusy] = useState<Id<"groupInvites"> | null>(null);
  const [error, setError] = useState(false);
  if (!invites?.length) return null;

  async function respond(inviteId: Id<"groupInvites">, join: boolean) {
    if (busy) return;
    setBusy(inviteId); setError(false);
    try {
      if (join) {
        const id = await accept({ inviteId });
        router.push(`/chats/${id}`);
      } else {
        await decline({ inviteId });
      }
    } catch {
      setError(true);
    } finally {
      setBusy(null);
    }
  }

  return <Card className="rounded-2xl">
    <CardHeader><CardTitle className="text-lg">{t("groupInvites")}</CardTitle></CardHeader>
    <CardContent className="space-y-3">
      {invites.map(invite => <div key={invite.inviteId} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted/60 p-3">
        <div className="min-w-0">
          <p className="font-semibold" dir="auto">{invite.groupName}</p>
          <p className="text-sm text-muted-foreground" dir="auto">{t("invitedBy", { name: invite.inviterName })}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" disabled={busy !== null}
            onClick={() => void respond(invite.inviteId, true)}>{t("acceptGroup")}</Button>
          <Button type="button" size="sm" variant="outline" disabled={busy !== null}
            onClick={() => void respond(invite.inviteId, false)}>{t("declineGroup")}</Button>
        </div>
      </div>)}
      {error && <p role="alert" className="text-sm text-destructive">{t("groupInviteFailed")}</p>}
    </CardContent>
  </Card>;
}
