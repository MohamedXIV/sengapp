"use client";

import { useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { Palette } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import type { Doc } from "../../../../convex/_generated/dataModel";
import { MemberGate } from "@/components/access/member-gate";
import { Badge } from "@/components/ui/badge";
import { AppearanceSettings } from "@/features/profile/appearance-settings";
import { resolveVisualPreferences } from "@/lib/themes/preferences";

export default function AppearancePage() {
  return <MemberGate>{(profile) => <AppearanceEditor key={profile._id} profile={profile} />}</MemberGate>;
}

function AppearanceEditor({ profile }: { profile: Doc<"profiles"> }) {
  const t = useTranslations("Appearance");
  const updateVisual = useMutation(api.profiles.updateVisualPreferences);
  return <div className="space-y-6">
    <header className="sengapp-section-intro space-y-3 rounded-[calc(var(--radius)+0.5rem)] border border-border/60 p-6 sm:p-8">
      <Badge variant="secondary" className="w-fit gap-1.5 rounded-full px-3 py-1">
        <Palette aria-hidden="true" className="size-3" />{t("title")}
      </Badge>
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{t("title")}</h1>
      <p className="max-w-xl text-sm leading-7 text-muted-foreground">{t("description")}</p>
    </header>
    <AppearanceSettings
      initialPreferences={resolveVisualPreferences(profile.visualPreferences)}
      initialMode={profile.themePreference}
      onSave={async (data) => { await updateVisual(data); }}
    />
  </div>;
}
