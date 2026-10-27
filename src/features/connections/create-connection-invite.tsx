"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
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
      setError(result.error.issues[0]?.message ?? "Check the invitation details.");
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
      setStatus("Connection invitation created. Copy or share the link.");
      setEmail("");
      setNote("");
    } catch {
      setError("Couldn't create an invitation. Try again in a moment.");
    } finally {
      setIsCreating(false);
    }
  }

  async function copyLink() {
    if (!link) return;
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(link);
      setStatus("Copied. You can now paste the invitation into your message.");
    } catch {
      linkRef.current?.focus();
      linkRef.current?.select();
      setStatus("Automatic copy is unavailable. Select and copy the visible link manually.");
    }
  }

  async function shareLink() {
    if (!link) return;
    if (!navigator.share) {
      setStatus("Native sharing isn't available. Use Copy link instead.");
      return;
    }
    try {
      await navigator.share({
        title: "Sengapp connection",
        text: "Would you like to connect with me on Sengapp?",
        url: link,
      });
      // A resolved chooser does not guarantee delivery to another person.
      setStatus("Share dialog closed. Your link is still available here.");
    } catch (reason) {
      setStatus(reason instanceof DOMException && reason.name === "AbortError"
        ? "Sharing canceled. Your link is still available to copy."
        : "Sharing wasn't available. You can copy the link instead.");
    }
  }

  return (
    <section className="space-y-6" aria-label="Invite someone to connect">
      <Card><form onSubmit={createInvite} className="space-y-4 p-5">
        <h2 className="text-lg font-semibold">Invite a friend</h2>
        <p className="text-sm text-muted-foreground">
          Anyone can join Sengapp. This one-use link only requests a private connection;
          the other person chooses whether to accept.
        </p>
        <p className="text-xs text-muted-foreground">
          An invitation without an email restriction can be used by the first eligible person who accepts it.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="connection-email">Friend&apos;s email (optional)</Label>
            <Input id="connection-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              autoComplete="off" placeholder="friend@example.com" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="connection-expiry">Expires after</Label>
            <Select value={String(ttlHours)} onValueChange={(value) => setTtlHours(Number(value) as 24 | 72 | 168)}>
              <SelectTrigger id="connection-expiry" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="24">24 hours</SelectItem>
                <SelectItem value="72">3 days</SelectItem>
                <SelectItem value="168">7 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="connection-note">Short note (optional)</Label>
          <Textarea id="connection-note" value={note} maxLength={200}
            onChange={(e) => setNote(e.target.value)}
            placeholder="It's me! Let's stay in touch." />
        </div>
        <Button type="submit" disabled={isCreating}>
          {isCreating ? "Creating…" : "Create invitation link"}
        </Button>
      </form></Card>

      {link && <Card className="space-y-3 border-primary/40 p-5">
        <h3 className="font-semibold">Your private invitation link</h3>
        <p className="text-xs text-muted-foreground">Shown only now. Treat this link as a secret until it expires or is used.</p>
        <Input ref={linkRef} readOnly aria-label="Invitation link" value={link}
          onFocus={(e) => e.currentTarget.select()}
          className="w-full" />
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={copyLink}>Copy link</Button>
          {nativeShare && <Button type="button" variant="outline" onClick={shareLink}>Share…</Button>}
        </div>
      </Card>}

      {status && <p role="status" className="text-sm text-muted-foreground">
        {issuedLink && !issuedStillActive ? "Invitation used or closed; its link is no longer active." : status}
      </p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

      <Card className="space-y-3 p-5">
        <h2 className="font-semibold">Open invitations</h2>
        {openInvitations.length === 0
          ? <p className="text-sm text-muted-foreground">No open invitations.</p>
          : <ul className="space-y-3">
              {openInvitations.map((inv) => <li key={inv._id} className="flex flex-wrap items-center justify-between gap-3 border-b pb-3 text-sm">
                <div className="space-y-1">
                  <p className="font-mono text-xs">{inv.codeHint} <span className="font-sans text-muted-foreground">· {inv.status}</span></p>
                  <p className="text-xs text-muted-foreground">
                    {inv.recipientEmail ? `Reserved for ${inv.recipientEmail}` : "Anyone with the link"}
                    {" · "}Expires {new Date(inv.expiresAt).toLocaleDateString()}
                  </p>
                </div>
                {inv.status === "pending" && <Button type="button" variant="link" size="sm" className="text-xs text-destructive"
                  onClick={async () => {
                    try { await onRevoke(inv._id); setStatus("Invitation revoked."); }
                    catch { setError("Could not revoke this invitation."); }
                  }}>Revoke</Button>}
              </li>)}
            </ul>}
      </Card>
    </section>
  );
}

