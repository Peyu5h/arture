"use client";

import { useRef, useEffect, KeyboardEvent } from "react";
import { motion } from "framer-motion";
import { Send, StopCircle } from "lucide-react";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { AgentInputProps } from "./types";

export const AgentInput = ({
  value,
  onChange,
  onSubmit,
  isLoading,
  disabled,
}: AgentInputProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // auto resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [value]);

  // focus on mount
  useEffect(() => {
    if (textareaRef.current && !disabled) {
      textareaRef.current.focus();
    }
  }, [disabled]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isLoading && !disabled) {
        onSubmit();
      }
    }
  };

  const canSubmit = value.trim().length > 0 && !isLoading && !disabled;

  return (
    <div className="border-border bg-card/80 border-t p-3 backdrop-blur-sm">
      <div
        className={cn(
          "bg-background flex items-end gap-2 rounded-xl border border-transparent p-1.5 pl-3",
          "shadow-sm transition-all duration-200",
          "focus-within:border-primary/40 focus-within:shadow-md",
        )}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything..."
          disabled={disabled || isLoading}
          rows={1}
          className={cn(
            "max-h-[120px] min-h-[36px] flex-1 resize-none bg-transparent py-2 text-sm leading-relaxed",
            "placeholder:text-muted-foreground/60",
            "focus:outline-none",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        />

        {isLoading ? (
          <Button
            size="icon"
            variant="ghost"
            className="text-muted-foreground hover:text-destructive h-9 w-9 shrink-0 rounded-lg"
          >
            <StopCircle className="h-4 w-4" />
          </Button>
        ) : (
          <motion.div
            initial={false}
            animate={{
              scale: canSubmit ? 1 : 0.95,
            }}
            transition={{ duration: 0.1 }}
          >
            <Button
              size="icon"
              variant={canSubmit ? "default" : "ghost"}
              className={cn(
                "h-9 w-9 shrink-0 rounded-lg transition-all",
                canSubmit
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground/50",
              )}
              onClick={onSubmit}
              disabled={!canSubmit}
            >
              <Send className="h-4 w-4" />
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
};
