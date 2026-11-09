"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { BotIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWorkspace } from "./workspace-state";

function IdentityForm({ initialName, initialHandle }: {
  initialName: string; initialHandle: string;
}) {
  const t = useTranslations("UiV2");
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
    <form aria-label={t("companionTitle")} onSubmit={submit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="companion-display-name">{t("companionName")}</Label>
        <Input id="companion-display-name" required maxLength={40}
          placeholder={t("companionNamePlaceholder")} value={name}
          onChange={event => setName(event.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="companion-mention-alias">{t("mentionAlias")}</Label>
        <Input id="companion-mention-alias" required minLength={2} maxLength={24}
          pattern="[a-zA-Z][a-zA-Z0-9_]{1,23}" autoCapitalize="none" spellCheck={false}
          placeholder={t("mentionExample")} value={handle}
          onChange={event => setHandle(event.target.value)} />
        <p className="text-xs text-muted-foreground">{t("mentionHint")}</p>
      </div>
      <Button type="submit" className="w-full">{t("saveCompanion")}</Button>
    </form>
  );
}

/** Centralized identity settings; future avatar and personality options belong here. */
export function CompanionSettingsPanel() {
  const t = useTranslations("UiV2");
  const { companion } = useWorkspace();
  return (
    <section aria-label={t("companionTitle")} data-testid="companion-settings" className="space-y-5 p-5">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <BotIcon className="size-4 text-muted-foreground" />
          <h2 className="font-semibold">{t("companionTitle")}</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          {t("companionDescription")}
        </p>
      </div>
      {companion && (
        <p className="rounded-lg bg-muted px-3 py-2 text-sm">
          {t("currentIdentity")} <span className="font-medium">{companion.name} (@{companion.handle})</span>
        </p>
      )}
      <IdentityForm key={(companion?.name ?? "") + ":" + (companion?.handle ?? "")}
        initialName={companion?.name ?? ""} initialHandle={companion?.handle ?? ""} />
      <p className="text-xs leading-relaxed text-muted-foreground">
        {t("companionLater")}
      </p>
    </section>
  );
}
