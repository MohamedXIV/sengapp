"use client";

import { BotIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Marker, MarkerContent } from "@/components/ui/marker";
import { Message, MessageAvatar, MessageContent, MessageFooter, MessageHeader } from "@/components/ui/message";
import {
  MessageScroller, MessageScrollerButton, MessageScrollerContent, MessageScrollerItem,
  MessageScrollerProvider, MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import { AgentActivity, type PreviewDecision } from "./agent-activity";
import type { MessageData } from "./data";

function ChatMessage({
  message, decisions, onDecision,
}: {
  message: MessageData;
  decisions: Readonly<Record<string, PreviewDecision>>;
  onDecision: (key: string, decision: PreviewDecision) => void;
}) {
  const t = useTranslations("UiV2");
  const agent = message.kind === "agent";
  const notice = message.kind === "notice";
  return (
    <MessageScrollerItem messageId={message.id}>
      <Message align={message.mine ? "end" : "start"}>
        {!message.mine && !notice && (
          <MessageAvatar>
            <Avatar>
              <AvatarFallback>{agent ? <BotIcon className="size-4" /> : message.sender.slice(0, 1)}</AvatarFallback>
            </Avatar>
          </MessageAvatar>
        )}
        <MessageContent className={agent ? "gap-3" : undefined}>
          {!message.mine && !notice && (
            <MessageHeader>
              <span>{message.sender}</span>
              <time className="ms-2">{message.time==="Now"?t("now"):message.time}</time>
              {agent && <Badge variant="outline">{t("mockCompanion")}</Badge>}
            </MessageHeader>
          )}
          <Bubble variant={notice ? "outline" : agent ? "tinted" : message.mine ? "muted" : "secondary"}>
            <BubbleContent>
              <p dir="auto" className="whitespace-pre-wrap">{message.text}</p>
            </BubbleContent>
          </Bubble>
          {agent && message.parts && (
            <AgentActivity messageId={message.id} parts={message.parts}
              decisions={decisions} onDecision={onDecision} />
          )}
          {(message.mine || notice) && <MessageFooter><time>{message.time}</time></MessageFooter>}
        </MessageContent>
      </Message>
    </MessageScrollerItem>
  );
}

export function VanillaTimeline({
  conversationId, messages, decisions, onDecision,
}: {
  conversationId: string;
  messages: MessageData[];
  decisions: Readonly<Record<string, PreviewDecision>>;
  onDecision: (key: string, decision: PreviewDecision) => void;
}) {
  const t = useTranslations("UiV2");
  return (
    <MessageScrollerProvider key={conversationId} defaultScrollPosition="end" autoScroll>
      <MessageScroller>
        <MessageScrollerViewport>
          <MessageScrollerContent className="gap-6 px-6 py-6">
            <MessageScrollerItem messageId={conversationId + "-date"}>
              <Marker variant="separator"><MarkerContent>{t("today")}</MarkerContent></Marker>
            </MessageScrollerItem>
            {messages.map(message => (
              <ChatMessage key={message.id} message={message} decisions={decisions} onDecision={onDecision} />
            ))}
          </MessageScrollerContent>
        </MessageScrollerViewport>
        <MessageScrollerButton />
      </MessageScroller>
    </MessageScrollerProvider>
  );
}
