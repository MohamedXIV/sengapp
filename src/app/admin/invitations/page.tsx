"use client";

import Link from "next/link";
import { MemberGate } from "@/components/access/member-gate";
import { useTranslations } from "next-intl";

export default function OperatorToolsPage() {
  return <MemberGate operatorOnly>{() => <OperatorContent />}</MemberGate>;
}

function OperatorContent() {
  const t = useTranslations("Operator");
  return <div className="space-y-4">
    <h1 className="text-2xl font-semibold">{t("title")}</h1>
    <p className="text-sm text-muted-foreground">
      {t("roles")}
    </p>
    <p className="text-sm text-muted-foreground">
      {t("invites")}
    </p>
    <Link className="text-primary underline" href="/connections">{t("connections")}</Link>
  </div>;
}

