"use client";

import { BotIcon, CheckCircle2Icon, Clock3Icon, ExternalLinkIcon, ShieldQuestionIcon, XCircleIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from "@/components/ui/item";
import {
  Trace, TraceCollapsible, TraceCollapsibleContent, TraceCollapsibleTrigger,
  TraceIcon, TraceLine, TraceTitle,
} from "@/components/ui/trace";
import type { AgentPart } from "./data";

export type PreviewDecision = "approved" | "denied";

export function AgentActivity({
  parts, messageId, decisions, onDecision,
}: {
  parts: AgentPart[];
  messageId: string;
  decisions: Readonly<Record<string, PreviewDecision>>;
  onDecision: (key: string, decision: PreviewDecision) => void;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-3" data-agent-activity="preview">
      <Trace>
        {parts.map((part, index) => {
          if (part.type === "plan") {
            return (
              <TraceCollapsible key={index} defaultOpen>
                <TraceCollapsibleTrigger aria-label={"Show steps for " + part.title}>
                  <TraceLine>
                    <TraceIcon><BotIcon className="size-4" /></TraceIcon>
                    <TraceTitle>{part.title}</TraceTitle>
                  </TraceLine>
                </TraceCollapsibleTrigger>
                <TraceCollapsibleContent>
                  <Trace>
                    {part.steps.map(step => (
                      <TraceLine key={step.title} status={step.status === "done" ? undefined : step.status}>
                        <TraceIcon>
                          {step.status === "done" ? <CheckCircle2Icon className="size-4" /> : <Clock3Icon className="size-4" />}
                        </TraceIcon>
                        <TraceTitle>{step.title}</TraceTitle>
                      </TraceLine>
                    ))}
                  </Trace>
                </TraceCollapsibleContent>
              </TraceCollapsible>
            );
          }
          if (part.type === "tool") {
            return (
              <TraceLine key={index} status={part.status === "done" ? undefined : part.status}>
                <TraceIcon><BotIcon className="size-4" /></TraceIcon>
                <TraceTitle>{part.title}</TraceTitle>
              </TraceLine>
            );
          }
          return null;
        })}
      </Trace>
      {parts.filter(part => part.type === "approval").map(part => {
        if (part.type !== "approval") return null;
        const key = messageId + ":" + part.id;
        const decision = decisions[key];
        return (
          <Item key={part.id} variant="outline" size="sm">
            <ItemMedia variant="icon"><ShieldQuestionIcon className="size-4" /></ItemMedia>
            <ItemContent>
              <ItemTitle>{part.title}</ItemTitle>
              <ItemDescription>{part.description}</ItemDescription>
              {decision && (
                <Badge variant="outline" data-preview-decision={decision}>
                  {decision === "approved" ? <CheckCircle2Icon className="me-1 size-3" /> : <XCircleIcon className="me-1 size-3" />}
                  {decision === "approved" ? "Approved locally · not executed" : "Denied locally"}
                </Badge>
              )}
            </ItemContent>
            {!decision && (
              <ItemActions>
                <Button type="button" size="sm" variant="outline" onClick={() => onDecision(key, "denied")}>Deny</Button>
                <Button type="button" size="sm" onClick={() => onDecision(key, "approved")}>Approve preview</Button>
              </ItemActions>
            )}
          </Item>
        );
      })}
      {parts.filter(part => part.type === "source").map((part, index) => part.type === "source" && (
        <Button key={index} asChild variant="link" size="sm" className="self-start">
          <a href={part.url} target="_blank" rel="noreferrer noopener">
            <ExternalLinkIcon className="size-4" />{part.label}
          </a>
        </Button>
      ))}
    </div>
  );
}
