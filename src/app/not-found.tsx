import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Home, MessageCircle, Waypoints } from "lucide-react";

export default async function NotFound() {
  const t = await getTranslations("Errors");
  return <main className="flex min-h-[75dvh] items-center justify-center px-6 py-14">
    <div className="sengapp-section-intro w-full max-w-lg space-y-6 rounded-3xl border border-border/70 p-8 text-center shadow-sm sm:p-12">
      <div className="mx-auto flex size-20 items-center justify-center rounded-3xl bg-primary/10 text-primary">
        <Waypoints aria-hidden="true" className="size-9" />
      </div>
      <p className="text-sm font-extrabold tracking-widest text-primary">404</p>
      <h1 className="text-3xl font-extrabold tracking-tight">{t("notFoundTitle")}</h1>
      <p className="text-sm leading-7 text-muted-foreground">{t("notFoundDescription")}</p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link href="/home" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"><Home aria-hidden="true" className="size-4" />{t("backHome")}</Link>
        <Link href="/chats" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-card px-5 py-2 text-sm font-semibold hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"><MessageCircle aria-hidden="true" className="size-4" />{t("backMessages")}</Link>
      </div>
    </div>
  </main>;
}
