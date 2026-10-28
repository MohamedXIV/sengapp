"use client";

import Link from "next/link";
import { MemberGate } from "@/components/access/member-gate";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export default function MemberHomePage() {
  return (
    <MemberGate>
      {(profile) => <HomeContent name={profile.displayName} operator={profile.role === "operator"} />}
    </MemberGate>
  );
}

function HomeContent({ name, operator }: { name: string; operator: boolean }) {
  const t = useTranslations("Home");
  return (
        <div className="space-y-5">
          <div className="text-4xl" aria-hidden="true">🌿</div>
          <h1 className="text-3xl font-semibold">{t("greeting", { name })}</h1>
          <p className="max-w-lg text-muted-foreground">
            {t("description")}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild><Link href="/connections">{t("invite")}</Link></Button>
            {operator && (
              <Button asChild variant="outline"><Link href="/settings/profile">{t("edit")}</Link></Button>
            )}
          </div>
        </div>
  );
}

