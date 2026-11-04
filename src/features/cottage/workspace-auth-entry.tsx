"use client";

import Link from "next/link";
import { Show, SignInButton } from "@clerk/nextjs";
import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";

function subscribePending(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}
function pendingSnapshot() {
  try { return Boolean(sessionStorage.getItem("sengapp:pending-invite")); }
  catch { return false; }
}

export function WorkspaceAuthEntry() {
  const t = useTranslations("CozyShell");
  const configured = Boolean(process.env.NEXT_PUBLIC_CONVEX_URL && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  const pendingInvite = useSyncExternalStore(subscribePending, pendingSnapshot, () => false);
  if (!configured || pendingInvite) return <Link href="/login" className="cottage-tool" aria-label={t("signIn")}>
    <span className="hidden sm:inline">{t("signIn")}</span><span className="sm:hidden">{t("signInCompact")}</span>
  </Link>;
  return <Show when="signed-out">
    <SignInButton mode="modal" fallbackRedirectUrl="/" signUpFallbackRedirectUrl="/">
      <button type="button" className="cottage-tool" aria-label={t("signIn")}>
        <span className="hidden sm:inline">{t("signIn")}</span><span className="sm:hidden">{t("signInCompact")}</span>
      </button>
    </SignInButton>
  </Show>;
}
