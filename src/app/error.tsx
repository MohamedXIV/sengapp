"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("Errors");
  return <main className="flex min-h-[70dvh] items-center justify-center px-6 py-12">
    <div role="alert" className="w-full max-w-lg space-y-5 rounded-3xl border bg-card p-8 text-center shadow-sm">
      <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive"><AlertCircle aria-hidden="true" /></span>
      <h1 className="text-2xl font-bold">{t("unexpectedTitle")}</h1>
      <p className="text-sm text-muted-foreground">{t("unexpectedDescription")}</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button type="button" onClick={reset} className="min-h-11 rounded-xl"><RotateCcw aria-hidden="true" />{t("retry")}</Button>
        <Button asChild variant="outline" className="min-h-11 rounded-xl"><Link href="/home">{t("backHome")}</Link></Button>
      </div>
    </div>
  </main>;
}
