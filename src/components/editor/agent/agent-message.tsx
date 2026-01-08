"use client";

import { memo, useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  AtSign,
  Copy,
  Check,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Image as ImageIcon,
  Square,
  Type,
  Move,
  Trash2,
  Palette,
  Search,
  Scissors,
  Wand2,
  Circle,
  Layers,
  Sparkles,
  FileText,
  LayoutTemplate,
  ScanEye,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { Markdown } from "~/components/ai-elements/markdown";
import {
  InlineChainOfThought,
  StepStatus,
} from "~/components/ai-elements/chain-of-thought";
import { Button } from "~/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { AgentMessageProps } from "./types";
import { InlinePositionSelector } from "./position-selector";
import { AgentUIComponent } from "./agent-ui-component";
import type { UIComponentRequest, UIComponentResponse } from "~/lib/ai/types";

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

// phrases indicating the AI needs position clarification
const POSITION_CLARIFICATION_PHRASES = [
  "where would you like me to",
  "where would you like it",
  "where should i place",
  "where should i put",
  "which position would you",
  "please specify the position",
  "please tell me where",
  "select a position",
  "choose a position",
  "pick a position",
  "what position would you",
];

// check if message is asking for position clarification
function isAskingForPositionClarification(content: string): boolean {
  const lowerContent = content.toLowerCase();
  return POSITION_CLARIFICATION_PHRASES.some((phrase) =>
    lowerContent.includes(phrase),
  );
}

// maps tool/action type to icon
function getToolIcon(type: string): typeof Wand2 | undefined {
  const iconMap: Record<string, typeof Wand2> = {
    spawn_shape: Square,
    add_text: Type,
    add_circle: Circle,
    move_element: Move,
    delete_element: Trash2,
    modify_element: Palette,
    resize_element: Square,
    change_layer_order: Layers,
    search_images: Search,
    add_image_to_canvas: ImageIcon,
    remove_background: Scissors,
    change_canvas_background: Palette,
    suggest_palette: Sparkles,
    suggest_fonts: FileText,
    search_templates: LayoutTemplate,
    load_template: LayoutTemplate,
    audit_design: ScanEye,
  };
  return iconMap[type] || Wand2;
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
              variant="link"
              size="icon"
              className={cn(
                "h-7 w-7 transition-colors",
                copied
                  ? "text-primary hover:text-primary"
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
              variant="link"
              size="icon"
              className={cn(
                "h-7 w-7 bg-transparent",
                feedback === "like"
                  ? "text-foreground"
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
              variant="link"
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

interface ToolStep {
  id: string;
  name: string;
  description: string;
  status: "pending" | "running" | "complete" | "error";
}

interface ExtendedAgentMessageProps extends AgentMessageProps {
  onPositionSelect?: (position: string) => void;
  toolSteps?: ToolStep[];
  uiComponentRequest?: UIComponentRequest;
  onUIComponentSubmit?: (response: UIComponentResponse) => void;
  onUIComponentCancel?: () => void;
  isUIComponentResolved?: boolean;
  uiComponentResolvedValue?: unknown;
}

export const AgentMessage = memo(function AgentMessage({
  message,
  onPositionSelect,
  toolSteps,
  uiComponentRequest,
  onUIComponentSubmit,
  onUIComponentCancel,
  isUIComponentResolved,
  uiComponentResolvedValue,
}: ExtendedAgentMessageProps) {
  const isUser = message.role === "user";
  const isError = message.status === "error";
  const hasMentions = message.mentions && message.mentions.length > 0;

  // only show position selector when AI explicitly asks for position clarification
  const showPositionSelector = useMemo(() => {
    if (isUser) return false;
    if (!onPositionSelect) return false;
    return isAskingForPositionClarification(message.content);
  }, [isUser, message.content, onPositionSelect]);

  // maps action status to chain-of-thought step status
  const mapActionStatus = (status: string | undefined): StepStatus => {
    switch (status) {
      case "pending":
        return "pending";
      case "running":
        return "active";
      case "complete":
        return "complete";
      case "error":
        return "error";
      default:
        return "complete";
    }
  };

  // convert message actions to chain-of-thought steps
  const chainOfThoughtSteps = useMemo(() => {
    if (toolSteps && toolSteps.length > 0) {
      return toolSteps.map((step, idx) => ({
        id: step.id || `step-${idx}`,
        label: step.description || step.name.replace(/_/g, " "),
        status: mapActionStatus(step.status),
        icon: getToolIcon(step.name),
      }));
    }
    if (message.actions && message.actions.length > 0) {
      return message.actions.map((action, idx) => ({
        id: action.id || `action-${idx}`,
        label: action.description || action.type.replace(/_/g, " "),
        status: mapActionStatus(action.status),
        icon: getToolIcon(action.type),
      }));
    }
    return [];
  }, [message.actions, toolSteps]);

  // always show chain of thought when there are actions
  const showChainOfThought = useMemo(() => {
    return chainOfThoughtSteps.length > 0;
  }, [chainOfThoughtSteps]);

  // get images from context or imageAttachments
  const displayImages = useMemo(() => {
    if (message.imageAttachments && message.imageAttachments.length > 0) {
      return message.imageAttachments;
    }
    if (
      message.context?.imageAttachments &&
      message.context.imageAttachments.length > 0
    ) {
      return message.context.imageAttachments;
    }
    return [];
  }, [message.imageAttachments, message.context?.imageAttachments]);

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
        <div className="bg-primary/10 dark:bg-primary/20 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg">
          <div className="bg-primary h-2 w-2 rounded-full" />
        </div>
      )}

      <div
        className={cn(
          "flex max-w-[85%] min-w-0 flex-col overflow-hidden",
          isUser ? "items-end" : "items-start",
        )}
      >
        {hasMentions && (
          <div className="mb-1.5 flex max-w-full flex-wrap gap-1 overflow-hidden">
            {message.mentions!.map((mention) => (
              <span
                key={mention.id}
                className={cn(
                  "inline-flex max-w-full items-center gap-1 truncate rounded-full px-2 py-0.5 text-[10px] font-medium",
                  mention.isOnCanvas
                    ? "bg-primary/15 dark:bg-primary/25 text-primary"
                    : "bg-muted text-muted-foreground",
                )}
              >
                <AtSign className="h-2.5 w-2.5 shrink-0" />
                <span className="truncate">{mention.label}</span>
              </span>
            ))}
          </div>
        )}

        {/* image attachments display for user messages */}
        {isUser && displayImages.length > 0 && (
          <div className="mb-2 flex flex-wrap justify-end gap-2">
            {displayImages.map((img) => (
              <div
                key={img.id}
                className="border-border/50 bg-muted relative h-16 w-16 overflow-hidden rounded-lg border"
              >
                <img
                  src={img.thumbnail || img.url || img.dataUrl}
                  alt={img.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        )}

        <div
          className={cn(
            "relative max-w-full overflow-hidden",
            isUser
              ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-2.5 shadow-sm"
              : "text-foreground",
            isError &&
              "bg-destructive/10 dark:bg-destructive/20 border-destructive/30 border",
          )}
        >
          {isUser ? (
            <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
              {message.content}
            </p>
          ) : (
            <div className="prose-sm dark:prose-invert max-w-full overflow-hidden break-words">
              <Markdown>{message.content}</Markdown>
            </div>
          )}

          {/* show chain-of-thought for tool execution */}
          {!isUser && showChainOfThought && chainOfThoughtSteps.length > 0 && (
            <InlineChainOfThought
              steps={chainOfThoughtSteps}
              className="mt-2"
              isStreaming={message.status === "streaming"}
            />
          )}

          {/* only show position selector when AI asks for clarification */}
          {showPositionSelector && (
            <InlinePositionSelector
              onSelect={(pos) => onPositionSelect!(pos)}
            />
          )}

          {/* render ui component if present */}
          {!isUser && uiComponentRequest && onUIComponentSubmit && (
            <div className="mt-3 min-w-0 max-w-full overflow-hidden">
              <AgentUIComponent
                request={uiComponentRequest}
                onSubmit={onUIComponentSubmit}
                onCancel={onUIComponentCancel}
                isResolved={isUIComponentResolved}
                resolvedValue={uiComponentResolvedValue}
              />
            </div>
          )}
        </div>

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
