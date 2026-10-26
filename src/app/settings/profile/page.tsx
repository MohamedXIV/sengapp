"use client";

import { useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { MemberGate } from "@/components/access/member-gate";
import { ProfileSettingsForm } from "@/features/profile/profile-settings-form";

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
  const updateProfile = useMutation(api.profiles.updateMine);
  const updatePresence = useMutation(api.profiles.updatePresencePreferences);
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Profile & privacy</h1>
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
          themePreference: profile.themePreference,
          reducedMotion: profile.reducedMotion,
        }}
        initialPresence={profile.presencePreferences}
        onSaveProfile={async (data) => { await updateProfile(data); }}
        onSavePresence={async (data) => { await updatePresence(data); }}
      />
    </div>
  );
}
