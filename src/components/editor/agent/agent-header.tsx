"use client";

import { memo } from "react";
import { Sparkles, X, Plus, History, Loader2 } from "lucide-react";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "~/components/ui/tooltip";
import { ContextStats } from "./types";
import { useAgentFlow } from "~/hooks/useAgentFlow";
import { PHASE_LABELS } from "~/store/agentFlowStore";
import { motion, AnimatePresence } from "framer-motion";

interface AgentHeaderProps {
  onClose: () => void;
  onNewChat?: () => void;
  onShowHistory?: () => void;
  conversationTitle?: string;
  contextStats?: ContextStats;
  isHistoryOpen?: boolean;
}

// compact flow status badge
const FlowStatusBadge = memo(function FlowStatusBadge() {
  const { phase, isActive, duration, currentTool } = useAgentFlow();

  if (!isActive || phase === "idle") return null;

  const label = currentTool?.displayName
    ? `${currentTool.displayName}`
    : PHASE_LABELS[phase];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-primary/10 flex items-center gap-1.5 rounded-full px-2 py-0.5"
    >
      <Loader2 className="text-primary h-3 w-3 animate-spin" />
      <span className="text-primary max-w-[80px] truncate text-[10px] font-medium">
        {label}
      </span>
      {duration !== null && duration > 0 && (
        <span className="text-primary/70 text-[10px] tabular-nums">
          {duration}s
        </span>
      )}
    </motion.div>
  );
});

export const AgentHeader = ({
  onClose,
  onNewChat,
  onShowHistory,
  conversationTitle,
  contextStats,
  isHistoryOpen,
}: AgentHeaderProps) => {
  return (
    <div className="border-border/40 bg-background flex h-12 shrink-0 items-center justify-between border-b px-3 backdrop-blur-sm dark:bg-zinc-900">
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <div className="from-primary/20 to-primary/10 dark:from-primary/30 dark:to-primary/10 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br">
          <Sparkles className="text-primary h-3.5 w-3.5" />
        </div>

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <span className="text-foreground max-w-[140px] truncate text-sm leading-tight font-medium">
            {conversationTitle || "New Chat"}
          </span>
        </div>

        {/* flow status badge */}
        <AnimatePresence>
          <FlowStatusBadge />
        </AnimatePresence>
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <TooltipProvider delayDuration={300}>
          {onNewChat && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground hover:bg-muted h-8 w-8"
                  onClick={onNewChat}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" variant="outline">
                New chat
              </TooltipContent>
            </Tooltip>
          )}

          {onShowHistory && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-8 w-8",
                    isHistoryOpen
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted",
                  )}
                  onClick={onShowHistory}
                >
                  <History className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" variant="outline">
                History
              </TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground hover:bg-muted h-8 w-8"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" variant="outline">
              Close
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};
