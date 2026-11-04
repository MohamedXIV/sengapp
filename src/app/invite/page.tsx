"use client";

import { useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { useConvexAuth } from "convex/react";
import { BackendRequired, MemberGate } from "@/components/access/member-gate";
import { AcceptConnectionInvite } from "@/features/connections/accept-connection-invite";
import { useTranslations } from "next-intl";

const INVITE_STORAGE_KEY = "sengapp:pending-invite";
const subscribeToHash = (onChange: () => void) => {
  window.addEventListener("hashchange", onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener("hashchange", onChange);
    window.removeEventListener("storage", onChange);
  };
};
const readInviteCode = () =>
  new URLSearchParams(window.location.hash.slice(1)).get("code") ??
  sessionStorage.getItem(INVITE_STORAGE_KEY);
const INITIALIZING = "sengapp:reading-invite";

export default function InvitePage() {
  // Authenticated invites render the full AppShell; do not constrain it to a
  // narrow public-invite card or nest a second main landmark.
  return <BackendRequired><InviteEntry /></BackendRequired>;
}

function InviteEntry() {
  const t = useTranslations("Invites");
  const common = useTranslations("Common");
  const code = useSyncExternalStore(subscribeToHash, readInviteCode, () => INITIALIZING);
  useEffect(() => {
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const fromLink = fragment.get("code");
    if (fromLink) {
      sessionStorage.setItem(INVITE_STORAGE_KEY, fromLink);
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, []);
  if (code === INITIALIZING) return <p role="status">{t("opening")}</p>;
  if (!code) return (
    <div className="mx-auto mt-16 max-w-xl space-y-4 rounded-xl border bg-card p-6">
      <h1 className="text-2xl font-semibold">{t("noLink")}</h1>
      <p className="text-sm text-muted-foreground">
        {t("askFriend")}
      </p>
      <Link href="/login" className="text-primary underline">{common("signInJoin")}</Link>
    </div>
  );
  return <ConnectionEntry code={code} />;
}

function ConnectionEntry({ code }: { code: string }) {
  const t = useTranslations("Invites");
  const { isLoading, isAuthenticated } = useConvexAuth();
  if (isLoading) return <p role="status">{t("checkingSignIn")}</p>;
  if (!isAuthenticated) return (
    <div className="space-y-4 rounded-xl border bg-card p-6">
      <h1 className="text-2xl font-semibold">{t("someoneConnect")}</h1>
      <p className="text-sm text-muted-foreground">
        {t("signInFirst")}
      </p>
      <Link href="/login" className="inline-flex rounded-lg bg-primary px-5 py-3 text-primary-foreground">
        {t("signInDecide")}
      </Link>
    </div>
  );
  return (
    <MemberGate>{() => <AcceptConnectionInvite code={code}
      onFinish={() => sessionStorage.removeItem(INVITE_STORAGE_KEY)} />}</MemberGate>
  );
}

