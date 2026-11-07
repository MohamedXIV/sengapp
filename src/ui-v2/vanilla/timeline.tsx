"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Marker, MarkerContent } from "@/components/ui/marker";
import { Message, MessageAvatar, MessageContent, MessageFooter, MessageHeader } from "@/components/ui/message";
import {
  MessageScroller, MessageScrollerButton, MessageScrollerContent,
  MessageScrollerItem, MessageScrollerProvider, MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import type { MessageData } from "./data";

function MessageRow({ message }: { message: MessageData }) {
  return (
    <Message align={message.mine ? "end" : "start"}>
      {!message.mine && (
        <MessageAvatar>
          <Avatar>
            <AvatarFallback>{message.sender.slice(0, 1)}</AvatarFallback>
          </Avatar>
        </MessageAvatar>
      )}
      <MessageContent>
        {!message.mine && <MessageHeader>{message.sender}</MessageHeader>}
        <Bubble variant={message.mine ? "default" : "secondary"}>
          <BubbleContent>
            <p dir="auto" className="whitespace-pre-wrap">{message.text}</p>
          </BubbleContent>
        </Bubble>
        <MessageFooter><time>{message.time}</time></MessageFooter>
      </MessageContent>
    </Message>
  );
}

export function VanillaTimeline({ conversationId, messages }: {
  conversationId: string; messages: MessageData[];
}) {
  return (
    <MessageScrollerProvider key={conversationId} defaultScrollPosition="end" autoScroll>
      <MessageScroller>
        <MessageScrollerViewport>
          <MessageScrollerContent>
            <MessageScrollerItem messageId={conversationId + "-date"}>
              <Marker variant="separator"><MarkerContent>Today</MarkerContent></Marker>
            </MessageScrollerItem>
            {messages.map(message => (
              <MessageScrollerItem key={message.id} messageId={message.id}>
                <MessageRow message={message} />
              </MessageScrollerItem>
            ))}
          </MessageScrollerContent>
        </MessageScrollerViewport>
        <MessageScrollerButton />
      </MessageScroller>
    </MessageScrollerProvider>
  );
}
