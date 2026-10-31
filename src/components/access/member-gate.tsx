"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";
import { AppShell } from "@/components/layout/app-shell";
import { AccountLocaleProvider } from "@/components/i18n/account-locale-provider";
import { PersonalThemeProvider } from "@/components/themes/personal-theme-provider";
import { Skeleton } from "@/components/ui/skeleton";
import { chooseLocale } from "@/lib/i18n/locale";

type Profile = Doc<"profiles">;

export function BackendRequired({ children }: { children: ReactNode }) {
  const t = useTranslations("Access");
  const common = useTranslations("Common");
  if (!process.env.NEXT_PUBLIC_CONVEX_URL || !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return (
      <div role="status" className="mx-auto max-w-lg rounded-2xl border bg-card p-6 text-center">
        <h1 className="text-xl font-semibold">{t("backendHeading")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("backendDescription")}
        </p>
        <Link href="/" className="mt-4 inline-block text-primary underline">{common("backWelcome")}</Link>
      </div>
    );
  }
  return <>{children}</>;
}

export function MemberGate({
  children,
  operatorOnly = false,
  embedded = false,
}: {
  children: (profile: Profile) => ReactNode;
  operatorOnly?: boolean;
  /** Use the same Clerk + Convex member gate inside a floating panel, without nesting the app sidebar. */
  embedded?: boolean;
}) {
  return (
    <BackendRequired>
      <AuthenticatedMember operatorOnly={operatorOnly} embedded={embedded}>{children}</AuthenticatedMember>
    </BackendRequired>
  );
}

function AuthenticatedMember({
  children,
  operatorOnly,
  embedded,
}: {
  children: (profile: Profile) => ReactNode;
  operatorOnly: boolean;
  embedded: boolean;
}) {
  const t = useTranslations("Access");
  const { isLoading, isAuthenticated } = useConvexAuth();
  if (isLoading) return <div className="mx-auto max-w-3xl space-y-4 p-8" role="status" aria-label={t("checkingSession")}><span className="sr-only">{t("checkingSession")}</span><Skeleton className="h-10 w-52 max-w-full" /><Skeleton className="h-40 w-full rounded-2xl" /></div>;
  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-md space-y-4 p-8 text-center">
        <h1 className="text-2xl font-semibold">{t("privateTitle")}</h1>
        <p className="text-muted-foreground">{t("verifyFirst")}</p>
        <Link href="/login" className="inline-flex rounded-lg bg-primary px-5 py-3 text-primary-foreground">{t("signIn")}</Link>
      </div>
    );
  }
  return <ResolvedMembership operatorOnly={operatorOnly} embedded={embedded}>{children}</ResolvedMembership>;
}

function ResolvedMembership({
  children,
  operatorOnly,
  embedded,
}: {
  children: (profile: Profile) => ReactNode;
  operatorOnly: boolean;
  embedded: boolean;
}) {
  const t = useTranslations("Access");
  const { user: clerkUser } = useUser();
  const profile = useQuery(api.profiles.getMine);
  const ensureMine = useMutation(api.profiles.ensureMine);
  const bootstrap = useMutation(api.profiles.bootstrapOperator);
  const [setupState, setSetupState] = useState<"idle" | "failed">("idle");
  const [setupError, setSetupError] = useState<string>("");
  const attemptedSetup = useRef<string | null>(null);

  useEffect(() => {
    if (profile === undefined || setupState !== "idle") return;
    const clerkName = clerkUser?.fullName?.trim()
      || [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ").trim();
    const needsName = Boolean(clerkName) &&
      (profile?.displayName === "New member" || profile?.displayNameSource === "fallback");
    const attempt = profile === null ? "create" : "upgrade";
    if (profile !== null && profile.handle && !needsName) return;
    if (attemptedSetup.current === attempt) return;
    attemptedSetup.current = attempt;
    const browserLanguages = navigator.languages?.join(",") || navigator.language;
    void ensureMine({
      locale: chooseLocale(browserLanguages),
      ...(clerkName ? { displayNameHint: clerkName.slice(0, 50) } : {}),
    }).catch((error: unknown) => {
      const value = String(error);
      setSetupError(value.includes("SUSPENDED")
        ? t("suspended")
        : value.includes("VERIFIED_SIGN_IN_REQUIRED")
          ? t("verifyEmail")
          : t("setupFailed"));
      setSetupState("failed");
    });
  }, [ensureMine, profile, setupState, t, clerkUser?.fullName, clerkUser?.firstName, clerkUser?.lastName]);

  if (profile === undefined) return <div role="status" aria-label={t("loading")} className="mx-auto w-full max-w-5xl space-y-5 px-5 py-8">
    <span className="sr-only">{t("loading")}</span>
    <Skeleton className="h-12 w-48 max-w-full rounded-xl" />
    <div className="flex gap-3"><Skeleton className="size-14 shrink-0 rounded-2xl" /><div className="flex-1 space-y-2"><Skeleton className="h-5 w-44 max-w-full" /><Skeleton className="h-4 w-64 max-w-full" /></div></div>
    <Skeleton className="h-48 w-full rounded-3xl" />
  </div>;
  if (!profile) {
    return (
      <div className="mx-auto max-w-md space-y-4 p-8 text-center">
        <h1 className="text-2xl font-semibold">{t("preparing")}</h1>
        {setupState !== "failed"
          ? <p role="status" className="text-sm text-muted-foreground">{t("creatingProfile")}</p>
          : <>
              <p role="alert" className="text-sm text-destructive">{setupError}</p>
              <button type="button" className="rounded-lg border px-4 py-2"
                onClick={() => { attemptedSetup.current = null; setSetupState("idle"); }}>{t("retry")}</button>
            </>}
      </div>
    );
  }
  if (operatorOnly && profile.role !== "operator") {
    return (
      <div className="mx-auto max-w-md space-y-4 p-8 text-center">
        <h1 className="text-2xl font-semibold">{t("operatorTitle")}</h1>
        <p role="alert">{t("operatorRequired")}</p>
        <OperatorBootstrap bootstrap={() => bootstrap({})} />
        <Link href="/home" className="inline-block text-primary underline">{t("backSpace")}</Link>
      </div>
    );
  }
  if (embedded) {
    return <AccountLocaleProvider locale={profile.locale}>
      <PersonalThemeProvider key={profile._id} profileId={profile._id}
        preferences={profile.visualPreferences} appearance={profile.themePreference}
        reducedMotion={profile.reducedMotion}>
        {children(profile)}
      </PersonalThemeProvider>
    </AccountLocaleProvider>;
  }
  return (
    <AppShell profileId={profile._id} visualPreferences={profile.visualPreferences}
      themePreference={profile.themePreference} reducedMotion={profile.reducedMotion}
      userRole={profile.role} displayName={profile.displayName}
      handle={profile.handle ?? "…"} locale={profile.locale}
      textDirection={profile.textDirection}>
      {children(profile)}
    </AppShell>
  );
}

function OperatorBootstrap({ bootstrap }: { bootstrap: () => Promise<unknown> }) {
  const t = useTranslations("Access");
  const [state, setState] = useState<string | null>(null);
  return (
    <div className="border-t pt-4 text-xs text-muted-foreground">
      <p>{t("operatorQuestion")}</p>
      <button type="button" className="mt-2 underline" onClick={async () => {
        try {
          await bootstrap();
          setState(t("operatorSuccess"));
        } catch {
          setState(t("operatorFailure"));
        }
      }}>{t("initializeOperator")}</button>
      {state && <p role="status" className="mt-2">{state}</p>}
    </div>
  );
}

