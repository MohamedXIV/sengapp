"use client";

import React, { useState } from "react";
import {
  profileUpdateSchema,
  presencePreferencesSchema,
  SQUIRREL_AVATAR_PRESETS,
  type ProfileUpdateInput,
  type PresencePreferencesInput,
} from "@/lib/validations/profile";
import { resolveElementDirection } from "@/lib/i18n/direction";

interface ProfileSettingsFormProps {
  initialProfile: ProfileUpdateInput;
  initialPresence: PresencePreferencesInput;
  onSaveProfile: (data: ProfileUpdateInput) => Promise<void>;
  onSavePresence: (data: PresencePreferencesInput) => Promise<void>;
}

export function ProfileSettingsForm({
  initialProfile,
  initialPresence,
  onSaveProfile,
  onSavePresence,
}: ProfileSettingsFormProps) {
  const [profile, setProfile] = useState<ProfileUpdateInput>(initialProfile);
  const [presence, setPresence] =
    useState<PresencePreferencesInput>(initialPresence);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setStatusBanner(null);

    const parsed = profileUpdateSchema.safeParse(profile);
    if (!parsed.success) {
      setErrorMessage(
        parsed.error.issues[0]?.message ?? "Invalid profile input."
      );
      return;
    }

    setIsSaving(true);
    try {
      await onSaveProfile(parsed.data);
      setStatusBanner("Profile preferences saved.");
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Could not update profile."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handlePresenceToggle = async (
    key: keyof PresencePreferencesInput,
    nextValue: boolean
  ) => {
    const updated = { ...presence, [key]: nextValue };
    setPresence(updated);
    const parsed = presencePreferencesSchema.safeParse(updated);
    if (!parsed.success) return;

    try {
      await onSavePresence(parsed.data);
      setStatusBanner("Presence privacy updated.");
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Failed to update presence setting."
      );
    }
  };

  return (
    <div className="space-y-8">
      {errorMessage && (
        <div
          role="alert"
          className="p-4 rounded-lg border border-destructive bg-destructive/10 text-destructive text-sm"
        >
          {errorMessage}
        </div>
      )}

      {statusBanner && (
        <div
          role="status"
          className="p-4 rounded-lg border border-primary/30 bg-accent text-accent-foreground text-sm"
        >
          {statusBanner}
        </div>
      )}

      <form
        onSubmit={handleProfileSubmit}
        className="p-6 rounded-xl border border-border bg-card space-y-5 shadow-sm"
      >
        <div>
          <h2 className="text-lg font-semibold">Identity & Expression</h2>
          <p className="text-sm text-muted-foreground">
            Customize how friends and family see you in shared spaces.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="displayName" className="text-sm font-medium block">
              Display Name
            </label>
            <input
              id="displayName"
              type="text"
              dir={resolveElementDirection(
                profile.textDirection,
                profile.displayName
              )}
              value={profile.displayName}
              onChange={(e) =>
                setProfile({ ...profile, displayName: e.target.value })
              }
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="handle" className="text-sm font-medium block">
              Unique Handle
            </label>
            <input
              id="handle"
              type="text"
              dir="ltr"
              value={profile.handle}
              onChange={(e) =>
                setProfile({ ...profile, handle: e.target.value.toLowerCase() })
              }
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="statusMessage" className="text-sm font-medium block">
            Personal Status Note (Messenger-style)
          </label>
          <input
            id="statusMessage"
            type="text"
            dir={resolveElementDirection(
              profile.textDirection,
              profile.statusMessage
            )}
            placeholder="Listening to rainy lo-fi & roasting chestnuts..."
            value={profile.statusMessage ?? ""}
            onChange={(e) =>
              setProfile({ ...profile, statusMessage: e.target.value })
            }
            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="bio" className="text-sm font-medium block">
            About You
          </label>
          <textarea
            id="bio"
            rows={3}
            dir={resolveElementDirection(profile.textDirection, profile.bio)}
            value={profile.bio ?? ""}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="avatarPreset" className="text-sm font-medium block">
              Squirrel Avatar Archetype
            </label>
            <select
              id="avatarPreset"
              value={profile.avatarPresetKey}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  avatarPresetKey:
                    e.target.value as ProfileUpdateInput["avatarPresetKey"],
                })
              }
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
            >
              {SQUIRREL_AVATAR_PRESETS.map((preset) => (
                <option key={preset} value={preset}>
                  {preset}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="locale" className="text-sm font-medium block">
              Preferred Language
            </label>
            <select
              id="locale"
              value={profile.locale}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  locale: e.target.value as "en" | "ar",
                })
              }
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
            >
              <option value="en">English (LTR)</option>
              <option value="ar">العربية (RTL)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="textDirection"
              className="text-sm font-medium block"
            >
              Text Direction Mode
            </label>
            <select
              id="textDirection"
              value={profile.textDirection}
              onChange={(e) =>
                setProfile({
                  ...profile,
                  textDirection: e.target.value as "auto" | "ltr" | "rtl",
                })
              }
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
            >
              <option value="auto">Automatic per paragraph</option>
              <option value="ltr">Left-to-Right (LTR)</option>
              <option value="rtl">Right-to-Left (RTL)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <input
            id="reducedMotion"
            type="checkbox"
            checked={profile.reducedMotion}
            onChange={(e) =>
              setProfile({ ...profile, reducedMotion: e.target.checked })
            }
            className="h-4 w-4 rounded border-input"
          />
          <label htmlFor="reducedMotion" className="text-sm">
            Prefer reduced motion (calm companion & interface animations)
          </label>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-95 disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save Profile Changes"}
        </button>
      </form>

      <section
        aria-labelledby="presence-heading"
        className="p-6 rounded-xl border border-border bg-card space-y-4 shadow-sm"
      >
        <div>
          <h2 id="presence-heading" className="text-lg font-semibold">
            Presence & Read Privacy
          </h2>
          <p className="text-sm text-muted-foreground">
            All signals are enabled by default for a warm shared space, and each
            can be toggled off independently at any time.
          </p>
        </div>

        <div className="divide-y divide-border">
          {(
            [
              {
                key: "onlineStatus",
                title: "Online Status",
                description: "Show when you are actively connected to Sengapp.",
              },
              {
                key: "lastSeen",
                title: "Last Seen Timestamp",
                description:
                  "Allow friends to see when you last visited the lounge.",
              },
              {
                key: "readReceipts",
                title: "Read Receipts",
                description:
                  "Show when you have read messages in direct and group chats.",
              },
              {
                key: "typingIndicators",
                title: "Typing Indicators",
                description:
                  "Display a live indicator when you are composing a reply.",
              },
            ] as const
          ).map((item) => (
            <div
              key={item.key}
              className="py-3.5 flex items-center justify-between gap-4"
            >
              <div>
                <p className="text-sm font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">
                  {item.description}
                </p>
              </div>
              <input
                type="checkbox"
                aria-label={item.title}
                checked={presence[item.key]}
                onChange={(e) =>
                  handlePresenceToggle(item.key, e.target.checked)
                }
                className="h-5 w-5 accent-primary rounded cursor-pointer"
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
