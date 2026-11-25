"use client";

import { useParams } from "next/navigation";
import { MemberGate } from "@/components/access/member-gate";
import { ConversationsList } from "@/features/chats/conversations-list";
import { DirectThread } from "@/features/chats/direct-thread";
import type { Id } from "../../../../convex/_generated/dataModel";

export default function DirectConversationPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const activeId = conversationId as Id<"conversations">;

  return (
    <MemberGate>
      {profile => (
        <div className="grid gap-4 lg:grid-cols-[19.5rem_minmax(0,1fr)] lg:items-stretch">
          <aside className="hidden lg:block lg:h-[calc(100dvh-11rem)] lg:max-h-[54rem] lg:min-h-96">
            <ConversationsList compact activeConversationId={activeId} />
          </aside>
          <div className="min-w-0">
            <DirectThread conversationId={activeId} meProfileId={profile._id} />
          </div>
        </div>
      )}
    </MemberGate>
  );
}
