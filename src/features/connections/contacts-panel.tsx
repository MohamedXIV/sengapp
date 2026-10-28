"use client";

import { useTranslations } from "next-intl";
import { UsersRound } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OpenDirectButton } from "@/features/chats/open-direct-button";
import type { Id } from "../../../convex/_generated/dataModel";

export function ContactsPanel({ contacts }: {
  contacts?: Array<{ connectionId: Id<"connections">; displayName: string; handle?: string }>;
}) {
  const t = useTranslations("Connections");
  return <Card className="sengapp-feature-card overflow-hidden rounded-[calc(var(--radius)+0.5rem)] border-border/70 shadow-sm">
    <CardHeader className="flex flex-row items-center gap-3 border-b border-border/60 pb-5">
      <span className="flex size-11 items-center justify-center rounded-2xl bg-accent text-primary" aria-hidden="true">
        <UsersRound className="size-5" />
      </span>
      <div>
        <CardTitle className="text-lg">{t("yourContacts")}</CardTitle>
        <p className="mt-1 text-xs text-muted-foreground">{t("contactsCaption")}</p>
      </div>
    </CardHeader>
    <CardContent className="p-5">
      {contacts === undefined
        ? <p role="status" className="text-sm text-muted-foreground">{t("loadingContacts")}</p>
        : contacts.length === 0
          ? <div className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-2xl bg-accent/25 px-5 py-8 text-center">
              <span aria-hidden="true" className="text-3xl">🍃</span>
              <p className="max-w-xs text-sm leading-7 text-muted-foreground">{t("noContacts")}</p>
            </div>
          : <ul className="divide-y divide-border/70">
              {contacts.map((contact) => <li key={contact.connectionId} className="flex items-center gap-3 py-4 first:pt-0 last:pb-0">
                <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent font-bold text-primary">
                  {Array.from(contact.displayName.trim())[0] || "✿"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold" dir="auto">{contact.displayName}</p>
                  {contact.handle && <p className="truncate text-xs text-muted-foreground" dir="ltr">@{contact.handle}</p>}
                </div>
                <OpenDirectButton connectionId={contact.connectionId} />
              </li>)}
            </ul>}
    </CardContent>
  </Card>;
}
