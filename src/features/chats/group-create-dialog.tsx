"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { UsersRound } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function GroupCreateDialog() {
  const t = useTranslations("Chats");
  const router = useRouter();
  const create = useMutation(api.groups.create);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = name.trim();
    if (!normalized || busy) return;
    setBusy(true); setError(false);
    try {
      const id = await create({ name: normalized });
      setOpen(false); setName("");
      router.push(`/chats/${id}`);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger asChild>
      <Button type="button" className="rounded-xl"><UsersRound aria-hidden="true" />{t("newGroup")}</Button>
    </DialogTrigger>
    <DialogContent className="max-w-md rounded-2xl">
      <DialogHeader>
        <DialogTitle>{t("newGroup")}</DialogTitle>
        <DialogDescription>{t("groupPrivacyNote")}</DialogDescription>
      </DialogHeader>
      <form onSubmit={(event) => void submit(event)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="new-group-name">{t("groupName")}</Label>
          <Input id="new-group-name" maxLength={60} required autoFocus value={name}
            placeholder={t("groupNamePlaceholder")} onChange={event => setName(event.target.value)} />
        </div>
        {error && <p role="alert" className="text-sm text-destructive">{t("groupCreateFailed")}</p>}
        <DialogFooter>
          <Button type="submit" disabled={busy || !name.trim()}>
            {busy ? t("creatingGroup") : t("createGroup")}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
