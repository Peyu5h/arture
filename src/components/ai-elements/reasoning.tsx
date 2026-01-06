"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, ChevronDown } from "lucide-react";
import { cn } from "~/lib/utils";

interface ReasoningContextValue {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isStreaming: boolean;
  duration?: number;
}

const ReasoningContext = React.createContext<ReasoningContextValue | null>(
  null
);

function useReasoningContext() {
  const context = React.useContext(ReasoningContext);
  if (!context) {
    throw new Error("useReasoningContext must be used within a Reasoning");
  }
  return context;
}

interface ReasoningProps extends React.HTMLAttributes<HTMLDivElement> {
  isStreaming?: boolean;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export const Reasoning = React.memo(function Reasoning({
  isStreaming = false,
  defaultOpen = true,
  children,
  className,
  ...props
}: ReasoningProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  const [duration, setDuration] = React.useState(0);
  const startTimeRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (isStreaming && !startTimeRef.current) {
      startTimeRef.current = Date.now();
      setIsOpen(true);
    }

    if (isStreaming) {
      const interval = setInterval(() => {
        if (startTimeRef.current) {
          setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }
      }, 1000);
      return () => clearInterval(interval);
    }

    if (!isStreaming && startTimeRef.current) {
      setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }
  }, [isStreaming]);

  return (
    <ReasoningContext.Provider value={{ isOpen, setIsOpen, isStreaming, duration }}>
      <div className={cn("w-full", className)} {...props}>
        {children}
      </div>
    </ReasoningContext.Provider>
  );
});

interface ReasoningTriggerProps extends React.HTMLAttributes<HTMLButtonElement> {
  title?: string;
  getThinkingMessage?: (isStreaming: boolean, duration?: number) => React.ReactNode;
}

export const ReasoningTrigger = React.memo(function ReasoningTrigger({
  title,
  getThinkingMessage,
  className,
  ...props
}: ReasoningTriggerProps) {
  const { isOpen, setIsOpen, isStreaming, duration } = useReasoningContext();

  const defaultMessage = React.useCallback(
    (streaming: boolean, dur?: number) => {
      if (streaming) {
        return `Thinking${dur && dur > 0 ? ` for ${dur}s` : "..."}`;
      }
      return dur && dur > 0 ? `Thought for ${dur}s` : "Thought for a few seconds";
    },
    []
  );

  const message = getThinkingMessage
    ? getThinkingMessage(isStreaming, duration)
    : defaultMessage(isStreaming, duration);

  return (
    <button
      onClick={() => setIsOpen(!isOpen)}
      className={cn(
        "flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-1.5",
        className
      )}
      {...props}
    >
      <div className="relative">
        <Lightbulb className={cn(
          "h-4 w-4",
          isStreaming && "text-amber-500"
        )} />
        {isStreaming && (
          <motion.div
            className="absolute inset-0 rounded-full bg-amber-500/20"
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </div>
      <span className="text-xs font-medium">{message}</span>
      <motion.div
        animate={{ rotate: isOpen ? 180 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <ChevronDown className="h-3 w-3" />
      </motion.div>
    </button>
  );
});

interface ReasoningContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const ReasoningContent = React.memo(function ReasoningContent({
  children,
  className,
  ...props
}: ReasoningContentProps) {
  const { isOpen, isStreaming } = useReasoningContext();

  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="overflow-hidden"
        >
          <div
            className={cn(
              "py-2 pl-6 border-l-2 border-muted text-sm text-muted-foreground",
              isStreaming && "border-amber-500/50",
              className
            )}
            {...props}
          >
            <div className="whitespace-pre-wrap">{children}</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
