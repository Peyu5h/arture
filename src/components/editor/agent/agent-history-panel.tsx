"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, MessageSquare, Trash2, Clock } from "lucide-react";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";
import { HistoryPanelProps } from "./types";

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return new Date(timestamp).toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });
}

export const AgentHistoryPanel = ({
  isOpen,
  onClose,
  conversations,
  activeId,
  onSelect,
  onDelete,
}: HistoryPanelProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.15 }}
          className="bg-card border-border absolute inset-0 z-10 flex flex-col border-l shadow-lg"
        >
          <div className="border-border flex h-12 shrink-0 items-center justify-between border-b px-3">
            <div className="flex items-center gap-2">
              <Clock className="text-muted-foreground h-4 w-4" />
              <span className="text-sm font-medium">Chat History</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground h-8 w-8"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2">
              {conversations.length === 0 ? (
                <div className="text-muted-foreground flex flex-col items-center justify-center py-12 text-center">
                  <MessageSquare className="mb-3 h-8 w-8 opacity-50" />
                  <p className="text-sm">No conversations yet</p>
                  <p className="mt-1 text-xs opacity-70">
                    Start a new chat to see history here
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className={cn(
                        "group relative flex cursor-pointer flex-col gap-1 rounded-lg p-3 transition-colors",
                        conv.id === activeId
                          ? "bg-primary/10 dark:bg-primary/15 border-primary/30 border"
                          : "hover:bg-muted",
                      )}
                      onClick={() => onSelect(conv.id)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-foreground line-clamp-1 flex-1 text-sm font-medium">
                          {conv.title}
                        </span>
                        {onDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive -mt-1 -mr-1.5 h-7 w-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(conv.id);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>

                      {conv.preview && (
                        <p className="text-muted-foreground line-clamp-2 text-xs">
                          {conv.preview}
                        </p>
                      )}

                      <div className="text-muted-foreground flex items-center gap-2 text-[10px]">
                        <span>{formatRelativeTime(conv.updatedAt)}</span>
                        <span>•</span>
                        <span>
                          {conv.messageCount}{" "}
                          {conv.messageCount === 1 ? "message" : "messages"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
