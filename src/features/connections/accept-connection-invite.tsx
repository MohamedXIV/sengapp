"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function AcceptConnectionInvite({ code, onFinish }: { code: string; onFinish: () => void }) {
  const t = useTranslations("Invites");
  const common = useTranslations("Common");
  const format = useFormatter();
  const router = useRouter();
  const context = useQuery(api.connectionInvites.preview, { code });
  const accept = useMutation(api.connectionInvites.accept);
  const decline = useMutation(api.connectionInvites.decline);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (context === undefined) return <p role="status">{t("checkingInvite")}</p>;
  if (!context.valid) return (
    <Card className="space-y-4 p-6">
      <h1 className="text-2xl font-semibold">{t("unavailable")}</h1>
      <p className="text-sm text-muted-foreground">
        {t("unavailableDetail")}
      </p>
      <Link href="/connections" className="text-primary underline">{common("backConnections")}</Link>
    </Card>
  );

  async function decide(choice: "accept" | "decline") {
    if (busy) return;
    setBusy(true); setError("");
    try {
      if (choice === "accept") await accept({ code });
      else await decline({ code });
      onFinish();
      router.replace("/connections");
    } catch {
      setError(t("choiceError"));
      setBusy(false);
    }
  }

  return (
    <Card className="space-y-5 p-6">
      <p className="text-sm font-semibold text-primary">{t("privateInvitation")}</p>
      <h1 className="text-2xl font-semibold">{t("connectWith", { name: context.senderDisplayName })}</h1>
      {context.note && <p className="rounded-lg bg-secondary p-3 text-sm" dir="auto">{context.note}</p>}
      <p className="text-sm text-muted-foreground">
        {t("acceptExplanation")}
      </p>
      <p className="text-xs text-muted-foreground">{t("expiresAt", { date: format.dateTime(new Date(context.expiresAt), { dateStyle: "medium", timeStyle: "short" }) })}</p>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-3">
        <Button type="button" disabled={busy} onClick={() => decide("accept")}>
          {busy ? common("pleaseWait") : t("accept")}
        </Button>
        <Button type="button" variant="outline" disabled={busy} onClick={() => decide("decline")}>{t("decline")}</Button>
      </div>
    </Card>
  );
}

