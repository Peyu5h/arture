"use client";

import { memo, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  AtSign,
  Copy,
  Check,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { Markdown } from "~/components/ai-elements/markdown";
import { Button } from "~/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { AgentMessageProps } from "./types";

type FeedbackType = "like" | "dislike" | null;

// formats timestamp
function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const MessageActions = memo(function MessageActions({
  content,
  onRetry,
}: {
  content: string;
  onRetry?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackType>(null);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  }, [content]);

  const handleFeedback = useCallback((type: FeedbackType) => {
    setFeedback((prev) => (prev === type ? null : type));
  }, []);

  return (
    <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
      <TooltipProvider delayDuration={300}>
        {onRetry && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground h-7 w-7"
                onClick={onRetry}
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" variant="outline">
              Regenerate
            </TooltipContent>
          </Tooltip>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              className={cn(
                "h-7 w-7 transition-colors",
                copied
                  ? "text-white hover:text-white"
                  : "text-muted-foreground hover:text-foreground",
              )}
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="h-3 w-3" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" variant="outline">
            {copied ? "Copied!" : "Copy"}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              className={cn(
                "h-7 w-7",
                feedback === "like"
                  ? "text-foreground bg-transparent"
                  : "text-muted-foreground hover:text-foreground",
              )}
              onClick={() => handleFeedback("like")}
            >
              <ThumbsUp
                className={cn("h-3 w-3", feedback === "like" && "fill-current")}
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" variant="outline">
            Good response
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              className={cn(
                "h-7 w-7",
                feedback === "dislike"
                  ? "text-foreground bg-transparent"
                  : "text-muted-foreground hover:text-foreground",
              )}
              onClick={() => handleFeedback("dislike")}
            >
              <ThumbsDown
                className={cn(
                  "h-3 w-3",
                  feedback === "dislike" && "fill-current",
                )}
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" variant="outline">
            Bad response
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
});

export const AgentMessage = memo(function AgentMessage({
  message,
}: AgentMessageProps) {
  const isUser = message.role === "user";
  const isError = message.status === "error";
  const hasMentions = message.mentions && message.mentions.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "group flex w-full gap-3",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      {!isUser && (
        <div className="bg-primary/10 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg">
          <div className="bg-primary h-2 w-2 rounded-full" />
        </div>
      )}

      <div
        className={cn(
          "flex max-w-[85%] flex-col",
          isUser ? "items-end" : "items-start",
        )}
      >
        {hasMentions && (
          <div className="mb-1.5 flex flex-wrap gap-1">
            {message.mentions!.map((mention) => (
              <span
                key={mention.id}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                  mention.isOnCanvas
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-muted-foreground",
                )}
              >
                <AtSign className="h-2.5 w-2.5" />
                {mention.label}
              </span>
            ))}
          </div>
        )}

        <div
          className={cn(
            "relative",
            isUser
              ? "bg-secondary text-secondary-foreground rounded-2xl rounded-br-md px-4 py-2.5"
              : "text-foreground",
            isError && "bg-destructive/5 border-destructive/20 border",
          )}
        >
          {isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {message.content}
            </p>
          ) : (
            <div className="prose-sm">
              <Markdown>{message.content}</Markdown>
            </div>
          )}
        </div>

        {message.actions && message.actions.length > 0 && (
          <div className="mt-2 flex flex-col gap-1">
            {message.actions.map((action) => (
              <div
                key={action.id}
                className="text-muted-foreground flex items-center gap-1.5 text-xs"
              >
                {action.status === "pending" && (
                  <div className="bg-muted-foreground/50 h-1.5 w-1.5 animate-pulse rounded-full" />
                )}
                {action.status === "running" && (
                  <div className="bg-primary h-1.5 w-1.5 animate-pulse rounded-full" />
                )}
                {action.status === "complete" && (
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                )}
                {action.status === "error" && (
                  <div className="bg-destructive h-1.5 w-1.5 rounded-full" />
                )}
                <span>{action.description}</span>
              </div>
            ))}
          </div>
        )}

        <div
          className={cn(
            "mt-1.5 flex items-center gap-2",
            isUser ? "flex-row-reverse" : "flex-row",
          )}
        >
          <span className="text-muted-foreground/50 text-[10px]">
            {formatTime(message.timestamp)}
          </span>

          {!isUser && <MessageActions content={message.content} />}
        </div>
      </div>
    </motion.div>
  );
});
