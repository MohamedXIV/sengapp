"use client";

import { useParams } from "next/navigation";
import { MemberGate } from "@/components/access/member-gate";
import { DirectThread } from "@/features/chats/direct-thread";
import type { Id } from "../../../../convex/_generated/dataModel";

export default function DirectConversationPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  return <MemberGate>{profile => <DirectThread
    conversationId={conversationId as Id<"conversations">} meProfileId={profile._id}
  />}</MemberGate>;
}
