"use client";

import { Sparkles, X, Plus, History } from "lucide-react";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "~/components/ui/tooltip";
import { ContextStats } from "./types";

interface AgentHeaderProps {
  onClose: () => void;
  onNewChat?: () => void;
  onShowHistory?: () => void;
  conversationTitle?: string;
  contextStats?: ContextStats;
  isHistoryOpen?: boolean;
}

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
      <div className="flex items-center gap-2.5">
        <div className="from-primary/20 to-primary/10 dark:from-primary/30 dark:to-primary/10 flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br">
          <Sparkles className="text-primary h-3.5 w-3.5" />
        </div>

        <div className="flex flex-col overflow-hidden">
          <span className="text-foreground max-w-[180px] truncate text-sm leading-tight font-medium">
            {conversationTitle || "New Chat"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-0.5">
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
