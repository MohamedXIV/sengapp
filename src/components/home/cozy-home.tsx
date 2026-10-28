"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Heart, Paintbrush, Sparkles } from "lucide-react";
import { CozyMark } from "@/components/brand/cozy-mark";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function CozyHome({ name, operator }: { name: string; operator: boolean }) {
  const t = useTranslations("Home");

  return <div className="space-y-7" data-role={operator ? "operator" : "member"}>
    <section className="sengapp-hero relative isolate overflow-hidden rounded-[calc(var(--radius)+1.2rem)] border border-border/70 px-6 py-9 shadow-sm sm:px-10 sm:py-12">
      <div className="relative z-10 grid items-center gap-4 md:grid-cols-[minmax(0,1fr)_minmax(180px,0.65fr)] md:gap-8">
        <div className="max-w-2xl space-y-5">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-card/75 px-3.5 py-1.5 text-xs font-semibold text-primary shadow-sm">
            <Sparkles aria-hidden="true" className="size-3.5" />{t("eyebrow")}
          </span>
          <h1 className="max-w-xl text-[clamp(2.1rem,4.5vw,3.4rem)] font-extrabold leading-[1.16] tracking-tight">
            {t("greeting", { name })}
          </h1>
          <p className="max-w-xl text-base leading-8 text-muted-foreground">{t("description")}</p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Button asChild size="lg" className="min-h-12 rounded-2xl px-6 shadow-sm">
              <Link href="/connections"><Heart aria-hidden="true" />{t("invite")}</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="min-h-12 rounded-2xl border-border/80 bg-card/75 px-6">
              <Link href="/settings/profile"><Paintbrush aria-hidden="true" />{t("edit")}</Link>
            </Button>
          </div>
        </div>
        <div className="pointer-events-none relative mx-auto w-full max-w-[280px] md:max-w-[350px]">
          <CozyMark className="h-auto w-full drop-shadow-sm" />
        </div>
      </div>
    </section>

    <section className="space-y-4" aria-label={t("nextSteps")}>
      <div className="space-y-1">
        <h2 className="text-xl font-bold tracking-tight">{t("nextSteps")}</h2>
        <p className="text-sm text-muted-foreground">{t("nextStepsDescription")}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="sengapp-feature-card rounded-[calc(var(--radius)+0.5rem)] border-border/70 shadow-sm">
          <CardHeader className="space-y-3 pb-3">
            <span aria-hidden="true" className="flex size-11 items-center justify-center rounded-2xl bg-accent text-xl">✉</span>
            <CardTitle className="text-base">{t("connectionTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm leading-6 text-muted-foreground">{t("connectionDescription")}</p>
          </CardContent>
        </Card>
        <Card className="sengapp-feature-card rounded-[calc(var(--radius)+0.5rem)] border-border/70 shadow-sm">
          <CardHeader className="space-y-3 pb-3">
            <span aria-hidden="true" className="flex size-11 items-center justify-center rounded-2xl bg-accent text-xl">✿</span>
            <CardTitle className="text-base">{t("personalTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm leading-6 text-muted-foreground">{t("personalDescription")}</p>
          </CardContent>
        </Card>
      </div>
    </section>
    <p className="rounded-2xl border border-dashed border-border/80 bg-card/35 px-5 py-4 text-sm leading-relaxed text-muted-foreground">
      <span aria-hidden="true">🌱 </span>{t("comingSoon")}
    </p>
  </div>;
}
