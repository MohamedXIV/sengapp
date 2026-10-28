import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const t = useTranslations("Landing");
  const common = useTranslations("Common");
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-foreground">
      <main className="w-full max-w-md space-y-6 text-center">
        <div className="space-y-2">
          <div className="text-5xl" aria-hidden="true">🐿️</div>
          <h1 className="text-3xl font-bold tracking-tight">Sengapp</h1>
          <p className="text-sm text-muted-foreground">{common("tagline")}</p>
        </div>
        <p className="rounded-lg border bg-muted/60 p-3 text-sm text-muted-foreground">
          {t("intro")}
        </p>
        <div className="flex flex-col gap-3">
          <Button asChild className="w-full"><Link href="/login">{common("signInJoin")}</Link></Button>
          <Link href="/invite" className="text-sm text-primary underline">
            {common("haveInvite")}
          </Link>
        </div>
      </main>
    </div>
  );
}

