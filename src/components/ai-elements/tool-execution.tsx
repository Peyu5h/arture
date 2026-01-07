"use client";

import { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "~/lib/utils";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Search,
  Image,
  Type,
  Square,
  Circle,
  Move,
  Trash2,
  Palette,
  Layers,
  Copy,
  Scissors,
  Wand2,
} from "lucide-react";

export type ToolStatus = "pending" | "running" | "complete" | "error";

export interface ToolStep {
  id: string;
  name: string;
  description: string;
  status: ToolStatus;
  result?: string;
  error?: string;
  startTime?: number;
  endTime?: number;
}

interface ToolExecutionProps {
  steps: ToolStep[];
  isExpanded?: boolean;
  className?: string;
}

// maps tool names to icons
const getToolIcon = (name: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    spawn_shape: <Square className="h-3.5 w-3.5" />,
    add_text: <Type className="h-3.5 w-3.5" />,
    add_circle: <Circle className="h-3.5 w-3.5" />,
    move_element: <Move className="h-3.5 w-3.5" />,
    delete_element: <Trash2 className="h-3.5 w-3.5" />,
    modify_element: <Palette className="h-3.5 w-3.5" />,
    resize_element: <Square className="h-3.5 w-3.5" />,
    change_layer_order: <Layers className="h-3.5 w-3.5" />,
    duplicate_element: <Copy className="h-3.5 w-3.5" />,
    search_images: <Search className="h-3.5 w-3.5" />,
    add_image_to_canvas: <Image className="h-3.5 w-3.5" />,
    remove_background: <Scissors className="h-3.5 w-3.5" />,
    change_canvas_background: <Palette className="h-3.5 w-3.5" />,
  };
  return iconMap[name] || <Wand2 className="h-3.5 w-3.5" />;
};

// formats tool name for display
const formatToolName = (name: string): string => {
  return name
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
};

const StatusIcon = memo(function StatusIcon({ status }: { status: ToolStatus }) {
  switch (status) {
    case "pending":
      return (
        <div className="h-3.5 w-3.5 rounded-full border-2 border-muted-foreground/30" />
      );
    case "running":
      return (
        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
      );
    case "complete":
      return (
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
      );
    case "error":
      return (
        <AlertCircle className="h-3.5 w-3.5 text-destructive" />
      );
  }
});

const ToolStepItem = memo(function ToolStepItem({ step }: { step: ToolStep }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasDetails = step.result || step.error;

  return (
    <div className="group">
      <button
        onClick={() => hasDetails && setIsExpanded(!isExpanded)}
        disabled={!hasDetails}
        className={cn(
          "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors",
          hasDetails && "hover:bg-muted/50 cursor-pointer",
          !hasDetails && "cursor-default"
        )}
      >
        <StatusIcon status={step.status} />

        <span className="text-muted-foreground">
          {getToolIcon(step.name)}
        </span>

        <span className="flex-1 truncate text-xs text-foreground">
          {step.description || formatToolName(step.name)}
        </span>

        {hasDetails && (
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
        {isExpanded && hasDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="ml-7 border-l-2 border-muted pl-3 py-1">
              {step.result && (
                <p className="text-xs text-muted-foreground">
                  {step.result}
                </p>
              )}
              {step.error && (
                <p className="text-xs text-destructive">
                  {step.error}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export const ToolExecution = memo(function ToolExecution({
  steps,
  isExpanded: defaultExpanded = true,
  className,
}: ToolExecutionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const completedCount = steps.filter((s) => s.status === "complete").length;
  const hasRunning = steps.some((s) => s.status === "running");
  const hasError = steps.some((s) => s.status === "error");

  if (steps.length === 0) return null;

  return (
    <div className={cn("rounded-lg border border-border/50 bg-muted/20", className)}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left"
      >
        {hasRunning ? (
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        ) : hasError ? (
          <AlertCircle className="h-4 w-4 text-destructive" />
        ) : (
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        )}

        <span className="flex-1 text-xs font-medium text-foreground">
          {hasRunning
            ? "Executing actions..."
            : hasError
              ? "Some actions failed"
              : `${completedCount} action${completedCount !== 1 ? "s" : ""} completed`}
        </span>

        <span className="text-muted-foreground">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </span>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border/50 px-1 py-1">
              {steps.map((step) => (
                <ToolStepItem key={step.id} step={step} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// inline compact version for message display
export const InlineToolExecution = memo(function InlineToolExecution({
  steps,
  className,
}: {
  steps: ToolStep[];
  className?: string;
}) {
  if (steps.length === 0) return null;

  return (
    <div className={cn("flex flex-col gap-0.5 mt-2", className)}>
      {steps.map((step) => (
        <div
          key={step.id}
          className="flex items-center gap-1.5 text-xs text-muted-foreground"
        >
          <StatusIcon status={step.status} />
          <span className="opacity-60">{getToolIcon(step.name)}</span>
          <span className="truncate">
            {step.description || formatToolName(step.name)}
          </span>
        </div>
      ))}
    </div>
  );
});
