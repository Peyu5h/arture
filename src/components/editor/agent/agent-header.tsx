"use client";

import { Sparkles, X, RotateCcw } from "lucide-react";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "~/components/ui/tooltip";

interface AgentHeaderProps {
  onClose: () => void;
  onClearHistory?: () => void;
  messageCount?: number;
}

export const AgentHeader = ({
  onClose,
  onClearHistory,
  messageCount = 0,
}: AgentHeaderProps) => {
  return (
    <div className="border-border/60 flex h-12 shrink-0 items-center justify-between border-b px-3">
      <div className="flex items-center gap-2">
        <div className="bg-primary/10 flex h-7 w-7 items-center justify-center rounded-lg">
          <Sparkles className="text-primary h-3.5 w-3.5" />
        </div>
        <div className="flex flex-col">
          <span className="text-foreground text-sm leading-tight font-medium">
            AI Assistant
          </span>
        </div>
      </div>

      <div className="flex items-center gap-0.5">
        <TooltipProvider delayDuration={300}>
          {messageCount > 0 && onClearHistory && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-foreground h-8 w-8"
                  onClick={onClearHistory}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" variant="outline">
                Reset chat
              </TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground h-8 w-8"
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
