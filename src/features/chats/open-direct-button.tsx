"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { MessageCircle } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";

export function OpenDirectButton({ connectionId }: { connectionId: Id<"connections"> }) {
  const t = useTranslations("Chats");
  const router = useRouter();
  const openDirect = useMutation(api.conversations.openDirect);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function open() {
    if (busy) return;
    setBusy(true);
    setError(false);
    try {
      const conversationId = await openDirect({ connectionId });
      router.push(`/chats/${conversationId}`);
    } catch {
      setError(true);
      setBusy(false);
    }
  }

  return <div className="flex shrink-0 flex-col items-end gap-1">
    <Button type="button" size="sm" variant="secondary" disabled={busy} onClick={() => void open()}
      className="rounded-xl" aria-label={t("messageAction")}>
      <MessageCircle aria-hidden="true" />{busy ? t("opening") : t("messageAction")}
    </Button>
    {error && <p role="alert" className="max-w-40 text-end text-xs text-destructive">{t("openFailed")}</p>}
  </div>;
}
