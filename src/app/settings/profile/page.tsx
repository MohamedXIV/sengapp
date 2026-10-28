"use client";

import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { MemberGate } from "@/components/access/member-gate";
import { ProfileSettingsForm } from "@/features/profile/profile-settings-form";
import { AppearanceSettings } from "@/features/profile/appearance-settings";
import { resolveVisualPreferences } from "@/lib/themes/preferences";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Paintbrush } from "lucide-react";

export default function ProfilePage() {
  return (
    <MemberGate>
      {(profile) => <ProfileEditor key={profile._id} profile={profile} />}
    </MemberGate>
  );
}

function ProfileEditor({
  profile,
}: {
  profile: import("../../../../convex/_generated/dataModel").Doc<"profiles">;
}) {
  const t = useTranslations("Profile");
  const appearance = useTranslations("Appearance");
  const updateProfile = useMutation(api.profiles.updateMine);
  const updatePresence = useMutation(api.profiles.updatePresencePreferences);
  const updateVisual = useMutation(api.profiles.updateVisualPreferences);
  return (
    <div className="space-y-6">
      <header className="sengapp-section-intro space-y-3 rounded-[calc(var(--radius)+0.5rem)] border border-border/60 p-6 sm:p-8">
        <Badge variant="secondary" className="w-fit gap-1.5 rounded-full px-3 py-1">
          <Paintbrush aria-hidden="true" className="size-3" />{appearance("title")}
        </Badge>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{t("title")}</h1>
        <p className="max-w-xl text-sm leading-7 text-muted-foreground">{t("identityDescription")}</p>
      </header>
      <section id="appearance" aria-label={appearance("title")}>
        <AppearanceSettings
          initialPreferences={resolveVisualPreferences(profile.visualPreferences)}
          initialMode={profile.themePreference}
          onSave={async (data) => { await updateVisual(data); }}
        />
      </section>
      <ProfileSettingsForm
        initialProfile={{
          displayName: profile.displayName,
          handle: profile.handle ?? "",
          bio: profile.bio ?? "",
          statusMessage: profile.statusMessage ?? "",
          avatarPresetKey: profile.avatarPresetKey as "acorn-scout",
          avatarAccentColor: profile.avatarAccentColor,
          locale: profile.locale,
          textDirection: profile.textDirection,
          reducedMotion: profile.reducedMotion,
        }}
        initialPresence={profile.presencePreferences}
        onSaveProfile={async (data) => { await updateProfile(data); }}
        onSavePresence={async (data) => { await updatePresence(data); }}
      />
    </div>
  );
}

