"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { SignIn } from "@clerk/nextjs";
import { useTranslations } from "next-intl";

const subscribeToStorage = (onChange: () => void) => {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
};

export default function LoginPage() {
  const t = useTranslations("Auth");
  const common = useTranslations("Common");
  const pendingInvite = useSyncExternalStore(
    subscribeToStorage,
    () => Boolean(sessionStorage.getItem("sengapp:pending-invite")),
    () => false,
  );
  const configured = Boolean(
    process.env.NEXT_PUBLIC_CONVEX_URL && process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  );

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-[radial-gradient(ellipse_at_30%_10%,#f8eed6_0%,#d9e9df_55%,#cadfd8_100%)] p-6 text-center text-[#283f35]">
      <Link href="/" className="flex size-14 items-center justify-center rounded-2xl border border-[#bfd4c5] bg-[#fffaf0] text-3xl shadow-sm" aria-label={t("homeLabel")}>🐿️</Link>
      <h1 className="max-w-md text-3xl font-semibold">{t("welcome")}</h1>
      <p className="max-w-md text-sm text-[#526f60]">
        {t("description")}
      </p>
      {configured
        ? <SignIn
            routing="hash"
            withSignUp
            fallbackRedirectUrl={pendingInvite ? "/invite" : "/"}
            signUpFallbackRedirectUrl={pendingInvite ? "/invite" : "/"}
          />
        : <p role="status" className="text-sm text-muted-foreground">
            {t("unavailable")}
          </p>}
      <Link href="/invite" className="text-sm text-primary underline">{common("haveInvite")}</Link>
    </main>
  );
}

