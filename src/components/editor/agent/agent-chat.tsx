"use client";

import { useEffect, useRef } from "react";
import { ScrollArea } from "~/components/ui/scroll-area";
import { AgentMessage } from "./agent-message";
import { AgentChatProps } from "./types";

export const AgentChat = ({ messages, isLoading }: AgentChatProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  return (
    <ScrollArea className="flex-1" ref={scrollRef}>
      <div className="flex flex-col gap-3 p-4">
        {messages.map((message) => (
          <AgentMessage key={message.id} message={message} />
        ))}

        {isLoading && (
          <div className="flex items-start gap-2.5">
            <div className="bg-primary/10 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg">
              <div className="bg-primary h-2 w-2 animate-pulse rounded-full" />
            </div>
            <div className="bg-muted flex items-center gap-1.5 rounded-2xl rounded-tl-sm px-3 py-2">
              <span
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-current opacity-60"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-current opacity-60"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-current opacity-60"
                style={{ animationDelay: "300ms" }}
              />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
};
