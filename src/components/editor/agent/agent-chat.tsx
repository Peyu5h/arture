"use client";

import { useEffect, useRef, memo, useState, useMemo } from "react";
import { ScrollArea } from "~/components/ui/scroll-area";
import { AgentMessage } from "./agent-message";
import { AgentChatProps, AgentMessage as AgentMessageType } from "./types";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "~/components/ai-elements/reasoning";
import { Spinner } from "~/components/kibo-ui/spinner";
import { Lightbulb, Brain, Scan, Play, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ShimmeringText } from "~/components/ui/shimmering-text";
import { useAgentFlow } from "~/hooks/useAgentFlow";
import {
  AgentFlowIndicator,
  InlineFlowIndicator,
  FlowTimeline,
} from "./agent-flow-indicator";
import { AgentStepViewer } from "./agent-step-viewer";
import { PHASE_LABELS } from "~/store/agentFlowStore";

// truncates text to max length
const truncateText = (text: string, maxLength: number = 18): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
};

interface ThinkingIndicatorProps {
  isStreaming?: boolean;
  content?: string;
}

// enhanced thinking indicator with flow state
const ThinkingIndicator = memo(function ThinkingIndicator({
  isStreaming = true,
  content,
}: ThinkingIndicatorProps) {
  const { phase, isActive, currentTool, toolExecutions, progress, duration } =
    useAgentFlow();

  // determine display label based on current phase
  const getPhaseLabel = () => {
    if (currentTool?.displayName && phase === "executing") {
      return `Executing: ${currentTool.displayName}`;
    }
    return PHASE_LABELS[phase] || "Thinking";
  };

  // determine icon based on phase
  const getPhaseIcon = () => {
    switch (phase) {
      case "analyzing":
        return <Scan className="text-primary h-4 w-4 animate-pulse" />;
      case "planning":
        return <Brain className="text-primary h-4 w-4 animate-pulse" />;
      case "executing":
        return <Play className="text-primary h-4 w-4" />;
      case "verifying":
        return <CheckCircle2 className="text-primary h-4 w-4 animate-pulse" />;
      default:
        return <Lightbulb className="text-muted-foreground h-4 w-4" />;
    }
  };

  // if we have reasoning content, use the reasoning component
  if (content) {
    return (
      <Reasoning isStreaming={isStreaming} defaultOpen={true}>
        <ReasoningTrigger />
        <ReasoningContent>{content}</ReasoningContent>
      </Reasoning>
    );
  }

  // enhanced flow-aware thinking indicator
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.15 }}
      className="flex flex-col gap-3"
    >
      {/* main indicator row */}
      <div className="flex items-start gap-3">
        <div className="bg-primary/10 dark:bg-primary/20 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg">
          <Spinner variant="infinite" size="lg" className="text-primary" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 pt-1">
            {getPhaseIcon()}
            <ShimmeringText
              text={getPhaseLabel()}
              className="text-sm font-medium"
              duration={1.5}
              repeatDelay={1}
            />
            {duration !== null && duration > 0 && (
              <span className="text-muted-foreground/60 text-xs">
                ({duration}s)
              </span>
            )}
          </div>

          {/* flow timeline */}
          {isActive && phase !== "idle" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-3"
            >
              <FlowTimeline />
            </motion.div>
          )}

          {/* progress bar */}
          {isActive && progress > 0 && progress < 100 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-2"
            >
              <div className="bg-muted h-1 w-full overflow-hidden rounded-full">
                <motion.div
                  className="bg-primary h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </motion.div>
          )}

          {/* tool executions preview */}
          {toolExecutions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 space-y-1"
            >
              {toolExecutions.slice(-3).map((tool) => (
                <div
                  key={tool.id}
                  className="text-muted-foreground flex items-center gap-2 text-xs"
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      tool.status === "active"
                        ? "bg-primary animate-pulse"
                        : tool.status === "complete"
                          ? "bg-emerald-500"
                          : tool.status === "error"
                            ? "bg-destructive"
                            : "bg-muted-foreground/30"
                    }`}
                  />
                  <span
                    className={`truncate ${
                      tool.status === "active" ? "text-foreground" : ""
                    }`}
                  >
                    {truncateText(tool.displayName, 22)}
                  </span>
                  {tool.status === "active" && (
                    <Spinner
                      variant="infinite"
                      size="sm"
                      className="text-primary"
                    />
                  )}
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
});

interface ExtendedAgentChatProps extends AgentChatProps {
  onPositionSelect?: (position: string) => void;
  showStepViewer?: boolean;
}

export const AgentChat = memo(function AgentChat({
  messages,
  isLoading,
  onPositionSelect,
  showStepViewer = true,
}: ExtendedAgentChatProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { isActive, toolExecutions, logs, phase } = useAgentFlow();
  const [showStepViewerDelayed, setShowStepViewerDelayed] = useState(false);
  const stepViewerTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // auto-scroll to bottom when messages change or loading state changes
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, toolExecutions.length]);

  // determine if we should show the step viewer with delay to prevent flash
  const hasFlowContent = toolExecutions.length > 0 || logs.length > 0;

  useEffect(() => {
    if (hasFlowContent && !isLoading && phase === "completed") {
      // delay showing step viewer to prevent flash
      stepViewerTimeoutRef.current = setTimeout(() => {
        setShowStepViewerDelayed(true);
      }, 500);
    } else if (isLoading || phase === "idle") {
      setShowStepViewerDelayed(false);
    }

    return () => {
      if (stepViewerTimeoutRef.current) {
        clearTimeout(stepViewerTimeoutRef.current);
      }
    };
  }, [hasFlowContent, isLoading, phase]);

  return (
    <ScrollArea className="flex-1" ref={scrollRef}>
      <div className="flex flex-col gap-4 p-4">
        {messages.map((message, index) => (
          <AgentMessage
            key={message.id}
            message={message}
            onPositionSelect={
              index === messages.length - 1 ? onPositionSelect : undefined
            }
          />
        ))}

        {/* loading indicator with flow state */}
        <AnimatePresence mode="wait">
          {isLoading && <ThinkingIndicator key="thinking" isStreaming={true} />}
        </AnimatePresence>

        {/* step viewer - show when flow has content, not loading, and after delay */}
        <AnimatePresence>
          {showStepViewer &&
            showStepViewerDelayed &&
            hasFlowContent &&
            !isLoading && (
              <motion.div
                key="step-viewer"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="mt-2"
              >
                <AgentStepViewer
                  defaultExpanded={false}
                  maxHeight={200}
                  showDelay={0}
                />
              </motion.div>
            )}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
});
