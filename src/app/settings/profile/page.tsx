"use client";

import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { MemberGate } from "@/components/access/member-gate";
import { ProfileSettingsForm } from "@/features/profile/profile-settings-form";
import { AppearanceSettings } from "@/features/profile/appearance-settings";
import { resolveVisualPreferences } from "@/lib/themes/preferences";
import { useTranslations } from "next-intl";

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
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
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

