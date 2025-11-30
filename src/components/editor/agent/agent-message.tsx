"use client";

import { motion } from "framer-motion";
import { Check, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "~/lib/utils";
import {
  AgentMessageProps,
  AgentAction,
  AgentActionIndicatorProps,
} from "./types";

const AgentActionIndicator = ({ action }: AgentActionIndicatorProps) => {
  const statusIcons = {
    pending: <Loader2 className="h-3 w-3 animate-spin opacity-50" />,
    running: <Loader2 className="text-primary h-3 w-3 animate-spin" />,
    complete: <Check className="h-3 w-3 text-emerald-500" />,
    error: <AlertCircle className="text-destructive h-3 w-3" />,
  };

  return (
    <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
      {statusIcons[action.status]}
      <span>{action.description}</span>
    </div>
  );
};

export const AgentMessage = ({ message }: AgentMessageProps) => {
  const isUser = message.role === "user";
  const isError = message.status === "error";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
      className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}
    >
      {!isUser && (
        <div className="bg-primary/10 mr-2.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg">
          <div className="bg-primary h-2 w-2 rounded-full" />
        </div>
      )}

      <div
        className={cn(
          "flex max-w-[85%] flex-col gap-1",
          isUser ? "items-end" : "items-start",
        )}
      >
        <div
          className={cn(
            "rounded-2xl px-3 py-2 text-sm leading-relaxed",
            isUser
              ? "bg-primary text-primary-foreground rounded-tr-sm"
              : "bg-muted text-foreground rounded-tl-sm",
            isError && "border-destructive/30 bg-destructive/5 border",
          )}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>

        {message.actions && message.actions.length > 0 && (
          <div className="mt-1 flex flex-col gap-0.5 px-1">
            {message.actions.map((action) => (
              <AgentActionIndicator key={action.id} action={action} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};
