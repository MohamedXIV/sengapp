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
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
        <Alert variant="destructive" role="alert"><AlertDescription>{errorMessage}</AlertDescription></Alert>
      )}

      {statusBanner && (
        <Alert role="status"><AlertDescription>{statusBanner}</AlertDescription></Alert>
      )}

      <Card><form
        onSubmit={handleProfileSubmit}
        className="p-6 space-y-5"
      >
        <div>
          <h2 className="text-lg font-semibold">Identity & Expression</h2>
          <p className="text-sm text-muted-foreground">
            Customize how friends and family see you in shared spaces.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="displayName">
              Display Name
            </Label>
            <Input
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
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="handle">
              Unique Handle
            </Label>
            <Input
              id="handle"
              type="text"
              dir="ltr"
              value={profile.handle}
              onChange={(e) =>
                setProfile({ ...profile, handle: e.target.value.toLowerCase() })
              }
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="statusMessage">
            Personal Status Note (Messenger-style)
          </Label>
          <Input
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
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bio">
            About You
          </Label>
          <Textarea
            id="bio"
            rows={3}
            dir={resolveElementDirection(profile.textDirection, profile.bio)}
            value={profile.bio ?? ""}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="avatarPreset">
              Squirrel Avatar Archetype
            </Label>
            <Select value={profile.avatarPresetKey} onValueChange={(value) =>
                setProfile({
                  ...profile,
                  avatarPresetKey: value as ProfileUpdateInput["avatarPresetKey"],
                })
              }>
              <SelectTrigger id="avatarPreset" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
              {SQUIRREL_AVATAR_PRESETS.map((preset) => (
                <SelectItem key={preset} value={preset}>
                  {preset}
                </SelectItem>
              ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="locale">
              Preferred Language
            </Label>
            <Select value={profile.locale} onValueChange={(value) =>
                setProfile({
                  ...profile,
                  locale: value as "en" | "ar",
                })
              }>
              <SelectTrigger id="locale" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English (LTR)</SelectItem>
                <SelectItem value="ar">العربية (RTL)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="textDirection">
              Text Direction Mode
            </Label>
            <Select value={profile.textDirection} onValueChange={(value) =>
                setProfile({
                  ...profile,
                  textDirection: value as "auto" | "ltr" | "rtl",
                })
              }>
              <SelectTrigger id="textDirection" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Automatic per paragraph</SelectItem>
                <SelectItem value="ltr">Left-to-Right (LTR)</SelectItem>
                <SelectItem value="rtl">Right-to-Left (RTL)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Switch
            id="reducedMotion"
            checked={profile.reducedMotion}
            onCheckedChange={(checked) =>
              setProfile({ ...profile, reducedMotion: checked })
            }
          />
          <Label htmlFor="reducedMotion">
            Prefer reduced motion (calm companion & interface animations)
          </Label>
        </div>

        <Button
          type="submit"
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save Profile Changes"}
        </Button>
      </form></Card>

      <Card
        aria-labelledby="presence-heading"
        className="p-6 space-y-4"
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
              <Switch
                aria-label={item.title}
                checked={presence[item.key]}
                onCheckedChange={(checked) =>
                  handlePresenceToggle(item.key, checked)
                }
              />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

