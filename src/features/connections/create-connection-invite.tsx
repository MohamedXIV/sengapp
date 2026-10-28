"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { useFormatter, useTranslations } from "next-intl";
import type { Id } from "../../../convex/_generated/dataModel";
import { createConnectionInviteSchema } from "@/lib/validations/invitation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface ConnectionInviteListItem {
  _id: Id<"connectionInvites">;
  codeHint: string;
  recipientEmail?: string;
  note?: string;
  status: "pending" | "accepted" | "declined" | "revoked";
  createdAt: number;
  expiresAt: number;
}

const subscribeToShareAvailability = () => () => {};
const getShareAvailability = () => typeof navigator.share === "function";

export function CreateConnectionInvite({
  invitations, onIssue, onRevoke,
}: {
  invitations: ConnectionInviteListItem[];
  onIssue: (input: { ttlHours: number; recipientEmail?: string; note?: string }) => Promise<{ code: string; expiresAt: number; invitationId: Id<"connectionInvites"> }>;
  onRevoke: (id: Id<"connectionInvites">) => Promise<unknown>;
}) {
  const t = useTranslations("Invites");
  const format = useFormatter();
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [ttlHours, setTtlHours] = useState<24 | 72 | 168>(72);
  const [issuedLink, setIssuedLink] = useState<{ url: string; invitationId: Id<"connectionInvites">; expiresAt: number } | null>(null);
  const linkRef = useRef<HTMLInputElement>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const nativeShare = useSyncExternalStore(subscribeToShareAvailability, getShareAvailability, () => false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const issuedRecord = issuedLink && invitations.find((invite) => invite._id === issuedLink.invitationId);
  const issuedStillActive = issuedLink && issuedLink.expiresAt > now
    && (!issuedRecord || (issuedRecord.status === "pending" && issuedRecord.expiresAt > now));
  const link = issuedStillActive ? issuedLink.url : "";
  const openInvitations = invitations.filter((invite) => invite.status === "pending" && invite.expiresAt > now);

  async function createInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isCreating) return;
    setError("");
    setStatus("");
    const result = createConnectionInviteSchema.safeParse({
      recipientEmail: email, note, ttlHours,
    });
    if (!result.success) {
      setError(t("validationFallback"));
      return;
    }
    setIsCreating(true);
    try {
      const issued = await onIssue({
        ttlHours: result.data.ttlHours,
        recipientEmail: result.data.recipientEmail || undefined,
        note: result.data.note || undefined,
      });
      const url = new URL("/invite", window.location.origin);
      url.hash = "code=" + issued.code;
      setIssuedLink({ url: url.toString(), invitationId: issued.invitationId, expiresAt: issued.expiresAt });
      setStatus(t("created"));
      setEmail("");
      setNote("");
    } catch {
      setError(t("createError"));
    } finally {
      setIsCreating(false);
    }
  }

  async function copyLink() {
    if (!link) return;
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(link);
      setStatus(t("copied"));
    } catch {
      linkRef.current?.focus();
      linkRef.current?.select();
      setStatus(t("copyManual"));
    }
  }

  async function shareLink() {
    if (!link) return;
    if (!navigator.share) {
      setStatus(t("shareUnavailable"));
      return;
    }
    try {
      await navigator.share({
        title: t("shareTitle"),
        text: t("shareMessage"),
        url: link,
      });
      // A resolved chooser does not guarantee delivery to another person.
      setStatus(t("shareClosed"));
    } catch (reason) {
      setStatus(reason instanceof DOMException && reason.name === "AbortError"
        ? t("shareCanceled")
        : t("shareError"));
    }
  }

  return (
    <section className="space-y-5" aria-label={t("ariaSection")}>
      <Card className="sengapp-feature-card rounded-[calc(var(--radius)+0.5rem)] border-border/70 shadow-sm">
        <form onSubmit={createInvite} className="space-y-5 p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-2xl text-primary">✉</span>
          <h2 className="text-lg font-bold">{t("inviteFriend")}</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          {t("inviteDescription")}
        </p>
        <p className="text-xs text-muted-foreground">
          {t("emailRestriction")}
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="connection-email">{t("friendEmail")}</Label>
            <Input id="connection-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              autoComplete="off" placeholder="friend@example.com" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="connection-expiry">{t("expiry")}</Label>
            <Select value={String(ttlHours)} onValueChange={(value) => setTtlHours(Number(value) as 24 | 72 | 168)}>
              <SelectTrigger id="connection-expiry" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="24">{t("hours24")}</SelectItem>
                <SelectItem value="72">{t("days3")}</SelectItem>
                <SelectItem value="168">{t("days7")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="connection-note">{t("note")}</Label>
          <Textarea id="connection-note" value={note} maxLength={200}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t("notePlaceholder")} />
        </div>
        <Button type="submit" disabled={isCreating} className="min-h-11 rounded-xl px-5">
          {isCreating ? t("creating") : t("createLink")}
        </Button>
      </form></Card>

      {link && <Card className="space-y-3 rounded-[calc(var(--radius)+0.5rem)] border-primary/40 bg-accent/20 p-5 shadow-sm">
        <h3 className="font-semibold">{t("privateLink")}</h3>
        <p className="text-xs text-muted-foreground">{t("privateLinkDescription")}</p>
        <Input ref={linkRef} readOnly aria-label={t("linkLabel")} value={link} dir="ltr"
          onFocus={(e) => e.currentTarget.select()}
          className="w-full" />
        <div className="flex flex-wrap gap-2">
          <Button type="button" className="min-h-10 rounded-xl" onClick={copyLink}>{t("copyLink")}</Button>
          {nativeShare && <Button type="button" className="min-h-10 rounded-xl" variant="outline" onClick={shareLink}>{t("share")}</Button>}
        </div>
      </Card>}

      {status && <p role="status" className="text-sm text-muted-foreground">
        {issuedLink && !issuedStillActive ? t("linkClosed") : status}
      </p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

      <Card className="sengapp-feature-card space-y-3 rounded-[calc(var(--radius)+0.5rem)] border-border/70 p-5 shadow-sm sm:p-6">
        <h2 className="text-base font-bold">{t("openInvites")}</h2>
        {openInvitations.length === 0
          ? <p className="text-sm text-muted-foreground">{t("noOpenInvites")}</p>
          : <ul className="space-y-3">
              {openInvitations.map((inv) => <li key={inv._id} className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-3 text-sm last:border-0 last:pb-0">
                <div className="space-y-1">
                  <p className="font-mono text-xs">{inv.codeHint} <span className="font-sans text-muted-foreground">· {t("statusPending")}</span></p>
                  <p className="text-xs text-muted-foreground">
                    {inv.recipientEmail ? t("reservedFor", { email: inv.recipientEmail }) : t("anyoneWithLink")}
                    {" · "}{t("expiresAt", { date: format.dateTime(new Date(inv.expiresAt), { dateStyle: "medium" }) })}
                  </p>
                </div>
                {inv.status === "pending" && <Button type="button" variant="link" size="sm" className="text-xs text-destructive"
                  onClick={async () => {
                    try { await onRevoke(inv._id); setStatus(t("revoked")); }
                    catch { setError(t("revokeError")); }
                  }}>{t("revoke")}</Button>}
              </li>)}
            </ul>}
      </Card>
    </section>
  );
}

