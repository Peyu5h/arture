"use client";

import { useEffect, useRef, memo } from "react";
import { ScrollArea } from "~/components/ui/scroll-area";
import { AgentMessage } from "./agent-message";
import { AgentChatProps } from "./types";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "~/components/ai-elements/reasoning";
import { Spinner } from "~/components/kibo-ui/spinner";
import { Lightbulb } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ShimmeringText } from "~/components/ui/shimmering-text";

interface ThinkingIndicatorProps {
  isStreaming?: boolean;
  content?: string;
}

const ThinkingIndicator = memo(function ThinkingIndicator({
  isStreaming = true,
  content,
}: ThinkingIndicatorProps) {
  if (content) {
    return (
      <Reasoning isStreaming={isStreaming} defaultOpen={true}>
        <ReasoningTrigger />
        <ReasoningContent>{content}</ReasoningContent>
      </Reasoning>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.15 }}
      className="flex items-start gap-3"
    >
      <div className="bg-primary/10 dark:bg-primary/20 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg">
        <Spinner variant="infinite" size="lg" className="text-primary" />
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Lightbulb className="text-muted-foreground h-4 w-4" />
        <ShimmeringText
          text="Thinking"
          className="text-sm font-medium"
          duration={1.5}
          repeatDelay={1}
        />
      </div>
    </motion.div>
  );
});

export const AgentChat = memo(function AgentChat({
  messages,
  isLoading,
}: AgentChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  return (
    <ScrollArea className="flex-1" ref={scrollRef}>
      <div className="flex flex-col gap-4 p-4">
        {messages.map((message) => (
          <AgentMessage key={message.id} message={message} />
        ))}

        <AnimatePresence mode="wait">
          {isLoading && <ThinkingIndicator key="thinking" isStreaming={true} />}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
});
