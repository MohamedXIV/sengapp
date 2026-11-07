"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Marker, MarkerContent } from "@/components/ui/marker";
import { Message, MessageAvatar, MessageContent, MessageFooter, MessageHeader } from "@/components/ui/message";
import {
  MessageScroller, MessageScrollerButton, MessageScrollerContent, MessageScrollerItem,
  MessageScrollerProvider, MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import type { MessageData } from "./data";

function ChatMessage({ message }: { message: MessageData }) {
  return (
    <MessageScrollerItem messageId={message.id}>
      <Message align={message.mine ? "end" : "start"}>
        {!message.mine && (
          <MessageAvatar>
            <Avatar>
              <AvatarFallback>{message.sender.slice(0, 1)}</AvatarFallback>
            </Avatar>
          </MessageAvatar>
        )}
        <MessageContent>
          {!message.mine && (
            <MessageHeader>
              {message.sender}<time className="ms-2">{message.time}</time>
            </MessageHeader>
          )}
          <Bubble variant={message.mine ? "muted" : "secondary"}>
            <BubbleContent>
              <p dir="auto" className="whitespace-pre-wrap">{message.text}</p>
            </BubbleContent>
          </Bubble>
          {message.mine && <MessageFooter><time>{message.time}</time></MessageFooter>}
        </MessageContent>
      </Message>
    </MessageScrollerItem>
  );
}

export function VanillaTimeline({ conversationId, messages }: {
  conversationId: string; messages: MessageData[];
}) {
  return (
    <MessageScrollerProvider key={conversationId} defaultScrollPosition="end" autoScroll>
      <MessageScroller>
        <MessageScrollerViewport>
          <MessageScrollerContent className="gap-6 px-6 py-6">
            <MessageScrollerItem messageId={conversationId + "-date"}>
              <Marker variant="separator"><MarkerContent>Today</MarkerContent></Marker>
            </MessageScrollerItem>
            {messages.map(message => <ChatMessage key={message.id} message={message} />)}
          </MessageScrollerContent>
        </MessageScrollerViewport>
        <MessageScrollerButton />
      </MessageScroller>
    </MessageScrollerProvider>
  );
}
