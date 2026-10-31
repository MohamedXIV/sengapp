"use client";

import { MemberGate } from "@/components/access/member-gate";
import { ConversationsList } from "@/features/chats/conversations-list";

export default function ChatsPage() {
  return <MemberGate>{() => <ConversationsList />}</MemberGate>;
}
