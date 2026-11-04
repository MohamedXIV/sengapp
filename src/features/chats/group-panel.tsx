"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type GroupMember = {
  profileId: Id<"profiles">;
  displayName: string;
  role: "owner" | "admin" | "member";
};

export function GroupPanel({ conversationId, meProfileId }: {
  conversationId: Id<"conversations">; meProfileId: Id<"profiles">;
}) {
  const t = useTranslations("Chats");
  const router = useRouter();
  const group = useQuery(api.groups.getDetails, { conversationId });
  const contacts = useQuery(api.connections.listMine);
  const invite = useMutation(api.groups.inviteMember);
  const rename = useMutation(api.groups.rename);
  const setRole = useMutation(api.groups.setRole);
  const remove = useMutation(api.groups.removeMember);
  const leave = useMutation(api.groups.leave);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentInvites, setSentInvites] = useState<Id<"profiles">[]>([]);
  const [memberToRemove, setMemberToRemove] = useState<GroupMember | null>(null);
  const [leavingGroup, setLeavingGroup] = useState(false);

  if (!group) return null;
  const isAdmin = group.role === "owner" || group.role === "admin";
  const activeName = name || group.name;
  const available = contacts?.filter(contact => !group.members.some(member => member.profileId === contact.profileId)) ?? [];

  async function run(task: () => Promise<unknown>, failure: string, after?: () => void) {
    if (busy) return;
    setBusy(true); setError(null);
    try {
      await task();
      after?.();
    } catch {
      setError(failure);
    } finally {
      setBusy(false);
    }
  }

  function submitRename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = activeName.trim();
    if (next && next !== group!.name) void run(
      () => rename({ conversationId, name: next }), t("renameFailed"), () => setName(""),
    );
  }

  return <div className="space-y-6">
    <div className="rounded-2xl bg-accent/40 p-4">
      <p className="font-semibold" dir="auto">{group.name}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t("groupPrivacyNote")}</p>
    </div>
    <div className="space-y-5">
      {isAdmin && <form onSubmit={submitRename} className="flex flex-wrap items-end gap-2">
        <div className="min-w-44 flex-1 space-y-1">
          <Label htmlFor="rename-group">{t("renameGroup")}</Label>
          <Input id="rename-group" maxLength={60} value={activeName}
            onChange={event => setName(event.target.value)} />
        </div>
        <Button variant="outline" type="submit" disabled={busy || !activeName.trim() || activeName.trim() === group.name}>
          {t("saveName")}
        </Button>
      </form>}
      <section className="space-y-2" aria-label={t("members")}>
        <h3 className="text-sm font-bold">{t("members")} · {group.members.length}</h3>
        <ul className="space-y-2">
          {group.members.map(member => <li key={member.profileId} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-muted/60 p-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate text-sm font-medium" dir="auto">{member.displayName}</span>
              <Badge variant="secondary">{t(member.role)}</Badge>
            </div>
            {member.profileId !== meProfileId && isAdmin && <div className="flex flex-wrap gap-1">
              {group.role === "owner" && <Button type="button" variant="ghost" size="sm" disabled={busy}
                aria-label={`${t(member.role === "admin" ? "demote" : "promote")} ${member.displayName}`}
                onClick={() => void run(() => setRole({ conversationId, profileId: member.profileId,
                  role: member.role === "admin" ? "member" : "admin" }), t("memberUpdateFailed"))}>
                {t(member.role === "admin" ? "demote" : "promote")}
              </Button>}
              {(group.role === "owner" || member.role === "member") && <Button type="button" variant="ghost" size="sm"
                disabled={busy} aria-label={`${t("removeMember")} ${member.displayName}`}
                onClick={() => {
                  setError(null);
                  setMemberToRemove(member);
                }}>
                {t("removeMember")}
              </Button>}
            </div>}
          </li>)}
        </ul>
      </section>
      {isAdmin && <section className="space-y-2" aria-label={t("inviteFriends")}>
        <h3 className="text-sm font-bold">{t("inviteFriends")}</h3>
        {available.length ? <ul className="space-y-2">
          {available.map(contact => <li key={contact.profileId} className="flex items-center justify-between gap-2 rounded-xl border border-border/70 p-3">
            <span className="truncate text-sm" dir="auto">{contact.displayName}</span>
            <Button type="button" size="sm" variant="outline" disabled={busy || sentInvites.includes(contact.profileId)}
              aria-label={`${t("inviteMember")} ${contact.displayName}`}
              onClick={() => void run(() => invite({ conversationId, profileId: contact.profileId }),
                t("inviteFailed"), () => setSentInvites(prev => [...prev, contact.profileId]))}>
              {sentInvites.includes(contact.profileId) ? t("inviteSent") : t("inviteMember")}
            </Button>
          </li>)}
        </ul> : <p className="text-sm text-muted-foreground">{t("noContactsToInvite")}</p>}
      </section>}
      {group.role !== "owner" && <Button type="button" variant="outline" disabled={busy}
        onClick={() => {
          setError(null);
          setLeavingGroup(true);
        }}>
        {t("leaveGroup")}
      </Button>}
      {error && !memberToRemove && !leavingGroup && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </div>

    <AlertDialog
      open={Boolean(memberToRemove)}
      onOpenChange={(open) => {
        if (!open && !busy) {
          setMemberToRemove(null);
          setError(null);
        }
      }}
    >
      <AlertDialogContent onEscapeKeyDown={(event) => { if (busy) event.preventDefault(); }}>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("removeMemberTitle", { name: memberToRemove?.displayName ?? "" })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("removeMemberDescription", { name: memberToRemove?.displayName ?? "" })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>
            {t("dialogCancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            className={buttonVariants({ variant: "destructive" })}
            disabled={busy}
            onClick={(event) => {
              event.preventDefault();
              if (!memberToRemove) return;
              void run(
                () => remove({ conversationId, profileId: memberToRemove.profileId }),
                t("memberUpdateFailed"),
                () => setMemberToRemove(null),
              );
            }}
          >
            {busy ? t("removingMember") : t("confirmRemove")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <AlertDialog
      open={leavingGroup}
      onOpenChange={(open) => {
        if (!open && !busy) {
          setLeavingGroup(false);
          setError(null);
        }
      }}
    >
      <AlertDialogContent onEscapeKeyDown={(event) => { if (busy) event.preventDefault(); }}>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("leaveGroupTitle")}</AlertDialogTitle>
          <AlertDialogDescription>{t("leaveGroupDescription")}</AlertDialogDescription>
        </AlertDialogHeader>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>
            {t("dialogCancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            className={buttonVariants({ variant: "destructive" })}
            disabled={busy}
            onClick={(event) => {
              event.preventDefault();
              void run(
                () => leave({ conversationId }),
                t("leaveFailed"),
                () => {
                  setLeavingGroup(false);
                  router.push("/chats");
                },
              );
            }}
          >
            {busy ? t("leavingGroup") : t("confirmLeave")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>;
}
