"use client";

import { useState, type FormEvent } from "react";
import { BotIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWorkspace } from "./workspace-state";

function IdentityForm({ initialName, initialHandle }: {
  initialName: string; initialHandle: string;
}) {
  const { saveCompanion } = useWorkspace();
  const [name, setName] = useState(initialName);
  const [handle, setHandle] = useState(initialHandle);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const displayName = name.trim(), mentionHandle = handle.trim().toLowerCase();
    if (!displayName || displayName.length > 40 || !/^[a-z][a-z0-9_]{1,23}$/.test(mentionHandle)) return;
    saveCompanion(displayName, mentionHandle);
  }
  return (
    <form aria-label="Companion identity" onSubmit={submit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="companion-display-name">Display name</Label>
        <Input id="companion-display-name" required maxLength={40}
          placeholder="Any name, including Arabic" value={name}
          onChange={event => setName(event.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="companion-mention-alias">Mention alias</Label>
        <Input id="companion-mention-alias" required minLength={2} maxLength={24}
          pattern="[a-zA-Z][a-zA-Z0-9_]{1,23}" autoCapitalize="none" spellCheck={false}
          placeholder="e.g. little_star" value={handle}
          onChange={event => setHandle(event.target.value)} />
        <p className="text-xs text-muted-foreground">Latin letters, digits and underscores; 2–24 characters.</p>
      </div>
      <Button type="submit" className="w-full">Save companion</Button>
    </form>
  );
}

/** Centralized identity settings; future avatar and personality options belong here. */
export function CompanionSettingsPanel() {
  const { companion } = useWorkspace();
  return (
    <section aria-label="Companion settings" data-testid="companion-settings" className="space-y-5 p-5">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <BotIcon className="size-4 text-muted-foreground" />
          <h2 className="font-semibold">Your companion</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Your companion has one identity across all of your conversations.
        </p>
      </div>
      {companion && (
        <p className="rounded-lg bg-muted px-3 py-2 text-sm">
          Current identity: <span className="font-medium">{companion.name} (@{companion.handle})</span>
        </p>
      )}
      <IdentityForm key={(companion?.name ?? "") + ":" + (companion?.handle ?? "")}
        initialName={companion?.name ?? ""} initialHandle={companion?.handle ?? ""} />
      <p className="text-xs leading-relaxed text-muted-foreground">
        Avatar and personality customization will live here too; they are not active in this UI-only preview.
        Nothing here contacts an AI provider.
      </p>
    </section>
  );
}
