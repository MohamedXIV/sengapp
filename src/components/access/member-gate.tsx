"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Doc } from "../../../convex/_generated/dataModel";
import { AppShell } from "@/components/layout/app-shell";
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
}: {
  children: (profile: Profile) => ReactNode;
  operatorOnly?: boolean;
}) {
  return (
    <BackendRequired>
      <AuthenticatedMember operatorOnly={operatorOnly}>{children}</AuthenticatedMember>
    </BackendRequired>
  );
}

function AuthenticatedMember({
  children,
  operatorOnly,
}: {
  children: (profile: Profile) => ReactNode;
  operatorOnly: boolean;
}) {
  const t = useTranslations("Access");
  const { isLoading, isAuthenticated } = useConvexAuth();
  if (isLoading) return <p role="status" className="p-8">{t("checkingSession")}</p>;
  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-md space-y-4 p-8 text-center">
        <h1 className="text-2xl font-semibold">{t("privateTitle")}</h1>
        <p className="text-muted-foreground">{t("verifyFirst")}</p>
        <Link href="/login" className="inline-flex rounded-lg bg-primary px-5 py-3 text-primary-foreground">{t("signIn")}</Link>
      </div>
    );
  }
  return <ResolvedMembership operatorOnly={operatorOnly}>{children}</ResolvedMembership>;
}

function ResolvedMembership({
  children,
  operatorOnly,
}: {
  children: (profile: Profile) => ReactNode;
  operatorOnly: boolean;
}) {
  const t = useTranslations("Access");
  const profile = useQuery(api.profiles.getMine);
  const ensureMine = useMutation(api.profiles.ensureMine);
  const bootstrap = useMutation(api.profiles.bootstrapOperator);
  const [setupState, setSetupState] = useState<"idle" | "failed">("idle");
  const [setupError, setSetupError] = useState<string>("");
  const attemptedSetup = useRef(false);

  useEffect(() => {
    if (profile !== null || setupState !== "idle" || attemptedSetup.current) return;
    attemptedSetup.current = true;
    const browserLanguages = navigator.languages?.join(",") || navigator.language;
    void ensureMine({ locale: chooseLocale(browserLanguages) }).catch((error: unknown) => {
      const value = String(error);
      setSetupError(value.includes("SUSPENDED")
        ? t("suspended")
        : value.includes("VERIFIED_SIGN_IN_REQUIRED")
          ? t("verifyEmail")
          : t("setupFailed"));
      setSetupState("failed");
    });
  }, [ensureMine, profile, setupState, t]);

  if (profile === undefined) return <p role="status" className="p-8">{t("loading")}</p>;
  if (!profile) {
    return (
      <div className="mx-auto max-w-md space-y-4 p-8 text-center">
        <h1 className="text-2xl font-semibold">{t("preparing")}</h1>
        {setupState !== "failed"
          ? <p role="status" className="text-sm text-muted-foreground">{t("creatingProfile")}</p>
          : <>
              <p role="alert" className="text-sm text-destructive">{setupError}</p>
              <button type="button" className="rounded-lg border px-4 py-2"
                onClick={() => { attemptedSetup.current = false; setSetupState("idle"); }}>{t("retry")}</button>
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
  return (
    <AppShell profileId={profile._id} visualPreferences={profile.visualPreferences}
      themePreference={profile.themePreference}
      userRole={profile.role} displayName={profile.displayName}
      handle={profile.handle ?? "new-member"} locale={profile.locale}
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

