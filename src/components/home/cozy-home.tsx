"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Heart, Paintbrush, Sparkles } from "lucide-react";
import { CozyMark } from "@/components/brand/cozy-mark";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function CozyHome({ name, operator }: { name: string; operator: boolean }) {
  const t = useTranslations("Home");

  return <div className="mx-auto max-w-4xl space-y-8 py-2" data-role={operator ? "operator" : "member"}>
    <section className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
      <div className="max-w-xl space-y-3">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-card/80 px-3 py-1 text-xs font-semibold text-primary shadow-xs">
          <Sparkles aria-hidden="true" className="size-3.5" />{t("eyebrow")}
        </span>
        <h1 className="text-[clamp(1.9rem,4vw,2.8rem)] font-extrabold leading-[1.15] tracking-tight">
          {t("greeting", { name })}
        </h1>
        <p className="text-sm leading-7 text-muted-foreground sm:text-base">{t("description")}</p>
      </div>
      <div className="pointer-events-none hidden w-28 shrink-0 sm:block md:w-36">
        <CozyMark className="h-auto w-full drop-shadow-sm" />
      </div>
    </section>

    <section className="space-y-4" aria-label={t("nextSteps")}>
      <div className="space-y-0.5">
        <h2 className="text-lg font-bold tracking-tight">{t("nextSteps")}</h2>
        <p className="text-sm text-muted-foreground">{t("nextStepsDescription")}</p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Card className="flex flex-col justify-between rounded-[calc(var(--radius)+0.75rem)] p-1">
          <CardHeader className="space-y-3 pb-3">
            <span aria-hidden="true" className="flex size-11 items-center justify-center rounded-2xl bg-accent text-xl">✉</span>
            <CardTitle className="text-base">{t("connectionTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-sm leading-6 text-muted-foreground">{t("connectionDescription")}</p>
            <Button asChild size="lg" className="min-h-11 w-full rounded-xl shadow-xs">
              <Link href="/connections"><Heart aria-hidden="true" />{t("invite")}</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="flex flex-col justify-between rounded-[calc(var(--radius)+0.75rem)] p-1">
          <CardHeader className="space-y-3 pb-3">
            <span aria-hidden="true" className="flex size-11 items-center justify-center rounded-2xl bg-accent text-xl">✿</span>
            <CardTitle className="text-base">{t("personalTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-sm leading-6 text-muted-foreground">{t("personalDescription")}</p>
            <Button asChild size="lg" variant="outline" className="min-h-11 w-full rounded-xl bg-card/75">
              <Link href="/settings/profile"><Paintbrush aria-hidden="true" />{t("edit")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>

    <p className="rounded-2xl border border-dashed border-border/80 bg-card/45 px-5 py-3.5 text-sm leading-relaxed text-muted-foreground">
      <span aria-hidden="true">🌱 </span>{t("comingSoon")}
    </p>
  </div>;
}
