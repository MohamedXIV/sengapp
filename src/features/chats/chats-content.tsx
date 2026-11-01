"use client";

import { useState } from "react";
import { MemberGate } from "@/components/access/member-gate";
import { ConversationsList } from "@/features/chats/conversations-list";
import { DirectThread } from "@/features/chats/direct-thread";
import type { Id } from "../../../convex/_generated/dataModel";

type ChatNavigation = {
  selectedConversation: Id<"conversations"> | null;
  openConversation: (id: Id<"conversations">) => void;
  returnToConversations: () => void;
};

/** The same member-gated chat feature: only presentation/navigation differ. */
export function ChatsContent({ embedded = false, navigation }: {
  embedded?: boolean;
  navigation?: ChatNavigation | null;
}) {
  const [localSelected, setLocalSelected] = useState<Id<"conversations"> | null>(null);
  const selected = navigation?.selectedConversation ?? localSelected;
  const select = navigation?.openConversation ?? setLocalSelected;
  const back = navigation?.returnToConversations ?? (() => setLocalSelected(null));

  return <MemberGate embedded={embedded}>{profile =>
    embedded && selected
      ? <DirectThread key={selected} embedded conversationId={selected}
          meProfileId={profile._id} onBack={back} />
      : <ConversationsList compact={embedded} onSelect={embedded ? select : undefined} />
  }</MemberGate>;
}
