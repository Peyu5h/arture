"use client";

import * as React from "react";
import { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "~/lib/utils";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Loader2,
  AlertCircle,
  LucideIcon,
  Lightbulb,
} from "lucide-react";

export type StepStatus = "pending" | "active" | "complete" | "error";

interface ChainOfThoughtContextValue {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const ChainOfThoughtContext =
  React.createContext<ChainOfThoughtContextValue | null>(null);

function useChainOfThought() {
  const context = React.useContext(ChainOfThoughtContext);
  if (!context) {
    throw new Error(
      "Chain of thought components must be used within <ChainOfThought />",
    );
  }
  return context;
}

// main container
interface ChainOfThoughtProps {
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export const ChainOfThought = memo(function ChainOfThought({
  children,
  defaultOpen = false,
  className,
}: ChainOfThoughtProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <ChainOfThoughtContext.Provider value={{ isOpen, setIsOpen }}>
      <div
        className={cn(
          "border-border/50 bg-muted/20 rounded-lg border dark:bg-zinc-900/50",
          className,
        )}
      >
        {children}
      </div>
    </ChainOfThoughtContext.Provider>
  );
});

// header with toggle
interface ChainOfThoughtHeaderProps {
  title?: string;
  className?: string;
}

export const ChainOfThoughtHeader = memo(function ChainOfThoughtHeader({
  title = "Thinking...",
  className,
}: ChainOfThoughtHeaderProps) {
  const { isOpen, setIsOpen } = useChainOfThought();

  return (
    <button
      onClick={() => setIsOpen(!isOpen)}
      className={cn(
        "hover:bg-muted/50 flex w-full items-center gap-2 rounded-t-lg px-3 py-2 text-left transition-colors",
        className,
      )}
    >
      <Lightbulb className="text-primary h-4 w-4" />
      <span className="text-foreground flex-1 text-xs font-medium">
        {title}
      </span>
      <span className="text-muted-foreground">
        {isOpen ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </span>
    </button>
  );
});

// content wrapper
interface ChainOfThoughtContentProps {
  children: React.ReactNode;
  className?: string;
}

export const ChainOfThoughtContent = memo(function ChainOfThoughtContent({
  children,
  className,
}: ChainOfThoughtContentProps) {
  const { isOpen } = useChainOfThought();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="overflow-hidden"
        >
          <div className={cn("border-border/50 border-t px-3 py-2", className)}>
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

// status icon component
const StatusIcon = memo(function StatusIcon({
  status,
}: {
  status: StepStatus;
}) {
  switch (status) {
    case "pending":
      return (
        <div className="border-muted-foreground/30 h-3.5 w-3.5 rounded-full border-2" />
      );
    case "active":
      return <Loader2 className="text-primary h-3.5 w-3.5 animate-spin" />;
    case "complete":
      return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
    case "error":
      return <AlertCircle className="text-destructive h-3.5 w-3.5" />;
  }
});

// individual step
interface ChainOfThoughtStepProps {
  icon?: LucideIcon;
  label: string;
  status: StepStatus;
  children?: React.ReactNode;
  className?: string;
}

export const ChainOfThoughtStep = memo(function ChainOfThoughtStep({
  icon: Icon,
  label,
  status,
  children,
  className,
}: ChainOfThoughtStepProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = !!children;

  return (
    <div className={cn("py-1", className)}>
      <button
        onClick={() => hasChildren && setIsExpanded(!isExpanded)}
        disabled={!hasChildren}
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors",
          hasChildren && "hover:bg-muted/50 cursor-pointer",
          !hasChildren && "cursor-default",
        )}
      >
        <StatusIcon status={status} />

        {Icon && (
          <span className="text-muted-foreground">
            <Icon className="h-3.5 w-3.5" />
          </span>
        )}

        <span className="text-foreground flex-1 text-xs">{label}</span>

        {hasChildren && (
          <span className="text-muted-foreground/50">
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isExpanded && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="border-muted ml-7 border-l-2 py-1 pl-3">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// search results container
interface ChainOfThoughtSearchResultsProps {
  children: React.ReactNode;
  className?: string;
}

export const ChainOfThoughtSearchResults = memo(
  function ChainOfThoughtSearchResults({
    children,
    className,
  }: ChainOfThoughtSearchResultsProps) {
    return (
      <div className={cn("flex flex-wrap gap-1.5 py-1", className)}>
        {children}
      </div>
    );
  },
);

// individual search result
interface ChainOfThoughtSearchResultProps {
  children: React.ReactNode;
  href?: string;
  className?: string;
}

export const ChainOfThoughtSearchResult = memo(
  function ChainOfThoughtSearchResult({
    children,
    href,
    className,
  }: ChainOfThoughtSearchResultProps) {
    const Component = href ? "a" : "span";
    return (
      <Component
        {...(href
          ? { href, target: "_blank", rel: "noopener noreferrer" }
          : {})}
        className={cn(
          "bg-muted/50 text-muted-foreground inline-flex items-center rounded-md px-2 py-1 text-xs",
          href && "hover:bg-muted cursor-pointer",
          className,
        )}
      >
        {children}
      </Component>
    );
  },
);

// image display
interface ChainOfThoughtImageProps {
  children: React.ReactNode;
  caption?: string;
  className?: string;
}

export const ChainOfThoughtImage = memo(function ChainOfThoughtImage({
  children,
  caption,
  className,
}: ChainOfThoughtImageProps) {
  return (
    <div className={cn("py-2", className)}>
      <div className="border-border/50 overflow-hidden rounded-lg border">
        {children}
      </div>
      {caption && (
        <p className="text-muted-foreground mt-1.5 text-xs">{caption}</p>
      )}
    </div>
  );
});

// compact inline version for messages
interface InlineChainOfThoughtProps {
  steps: Array<{
    id: string;
    label: string;
    status: StepStatus;
    icon?: LucideIcon;
  }>;
  className?: string;
  isStreaming?: boolean;
}

export const InlineChainOfThought = memo(function InlineChainOfThought({
  steps,
  className,
  isStreaming = false,
}: InlineChainOfThoughtProps) {
  if (steps.length === 0) return null;

  const allComplete = steps.every(
    (s) => s.status === "complete" || s.status === "error",
  );

  if (steps.length === 1 && allComplete) {
    const step = steps[0];
    const Icon = step.icon;
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "text-muted-foreground mt-2 flex items-center gap-1.5 text-xs",
          className,
        )}
      >
        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
        {Icon && <Icon className="h-3 w-3 opacity-60" />}
        <span className="truncate">{step.label}</span>
      </motion.div>
    );
  }

  return (
    <div
      className={cn(
        "border-border/50 bg-muted/20 mt-2 max-w-full overflow-hidden rounded-lg border px-3 py-2 dark:bg-zinc-900/50",
        className,
      )}
    >
      {isStreaming && (
        <div className="mb-1.5 flex items-center gap-2">
          <Loader2 className="text-primary h-3.5 w-3.5 animate-spin" />
          <span className="text-foreground text-xs font-medium">
            Processing...
          </span>
        </div>
      )}

      <div className="flex flex-col gap-0.5">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const stepKey = step.id || `step-${index}`;
          const stepStatus = step.status || "complete";
          return (
            <motion.div
              key={stepKey}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1, duration: 0.2 }}
              className="text-muted-foreground flex min-w-0 items-center gap-1.5 text-xs"
            >
              <StatusIcon status={stepStatus} />
              {Icon && (
                <span className="shrink-0 opacity-60">
                  <Icon className="h-3 w-3" />
                </span>
              )}
              <span className="min-w-0 truncate">{step.label}</span>
            </motion.div>
          );
        })}
      </div>

      {allComplete && !isStreaming && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: steps.length * 0.1 }}
          className="border-border/30 mt-1.5 flex items-center gap-1.5 border-t pt-1.5 text-xs text-emerald-600 dark:text-emerald-400"
        >
          <CheckCircle2 className="h-3 w-3" />
          <span>Done</span>
        </motion.div>
      )}
    </div>
  );
});
