"use client";

import type { FormEvent } from "react";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupTextarea } from "@/components/ui/input-group";

export function VanillaComposer({ text, onTextChange, onSend }: {
  text: string; onTextChange: (value: string) => void; onSend: () => void;
}) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSend();
  }
  return (
    <form onSubmit={submit} aria-label="Demo message composer">
      <InputGroup>
        <InputGroupTextarea
          aria-label="Write a message"
          placeholder="Write a message…"
          rows={2}
          value={text}
          onChange={event => onTextChange(event.target.value)}
        />
        <InputGroupAddon align="block-end">
          <InputGroupButton size="sm" variant="default" type="submit" disabled={!text.trim()}>
            Send
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </form>
  );
}
