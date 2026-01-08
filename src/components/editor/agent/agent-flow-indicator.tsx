"use client";

import { memo, useMemo } from "react";

// truncates text to max length
const truncateText = (text: string, maxLength: number = 20): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
};
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "~/lib/utils";
import {
  Scan,
  Brain,
  Play,
  CheckCircle2,
  AlertCircle,
  Circle,
  Loader2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useAgentFlow } from "~/hooks/useAgentFlow";
import { AgentPhase, PHASE_LABELS, StepStatus } from "~/store/agentFlowStore";

// phase to icon mapping
const PhaseIcon = memo(function PhaseIcon({
  phase,
  isAnimated = false,
}: {
  phase: AgentPhase;
  isAnimated?: boolean;
}) {
  const iconClass = cn("h-4 w-4", isAnimated && "animate-pulse");

  switch (phase) {
    case "idle":
      return <Circle className={iconClass} />;
    case "analyzing":
      return <Scan className={cn(iconClass, isAnimated && "animate-spin")} />;
    case "planning":
      return <Brain className={cn(iconClass, isAnimated && "animate-pulse")} />;
    case "executing":
      return <Play className={iconClass} />;
    case "verifying":
      return <Loader2 className={cn(iconClass, "animate-spin")} />;
    case "completed":
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    case "error":
      return <AlertCircle className="text-destructive h-4 w-4" />;
    default:
      return <Circle className={iconClass} />;
  }
});

// status indicator dot
const StatusDot = memo(function StatusDot({ status }: { status: StepStatus }) {
  return (
    <span
      className={cn(
        "h-2 w-2 rounded-full",
        status === "pending" && "bg-muted-foreground/30",
        status === "active" && "bg-primary animate-pulse",
        status === "complete" && "bg-emerald-500",
        status === "error" && "bg-destructive",
        status === "skipped" && "bg-muted-foreground/50",
      )}
    />
  );
});

// progress bar component
const FlowProgressBar = memo(function FlowProgressBar({
  progress,
  label,
  isActive,
}: {
  progress: number;
  label?: string;
  isActive: boolean;
}) {
  if (!isActive && progress === 0) return null;

  return (
    <div className="w-full space-y-1">
      <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
        <motion.div
          className="bg-primary h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      </div>
      {label && <p className="text-muted-foreground text-[10px]">{label}</p>}
    </div>
  );
});

// single step item in the flow
const FlowStepItem = memo(function FlowStepItem({
  label,
  status,
  isLast,
}: {
  label: string;
  status: StepStatus;
  isLast: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-2"
    >
      <StatusDot status={status} />
      <span
        className={cn(
          "text-xs",
          status === "active" && "text-foreground font-medium",
          status === "complete" && "text-muted-foreground",
          status === "pending" && "text-muted-foreground/60",
          status === "error" && "text-destructive",
        )}
      >
        {label}
      </span>
      {status === "active" && (
        <Loader2 className="text-primary h-3 w-3 animate-spin" />
      )}
    </motion.div>
  );
});

interface AgentFlowIndicatorProps {
  className?: string;
  compact?: boolean;
  showSteps?: boolean;
  showProgress?: boolean;
}

// main flow indicator component
export const AgentFlowIndicator = memo(function AgentFlowIndicator({
  className,
  compact = false,
  showSteps = true,
  showProgress = true,
}: AgentFlowIndicatorProps) {
  const {
    phase,
    isActive,
    steps,
    toolExecutions,
    currentTool,
    progress,
    progressLabel,
    duration,
  } = useAgentFlow();

  // don't show when idle
  if (phase === "idle" && !isActive) return null;

  const phaseLabel = PHASE_LABELS[phase];
  const activeToolLabel = currentTool?.displayName;

  // build display label
  const displayLabel = useMemo(() => {
    if (activeToolLabel && phase === "executing") {
      return `Executing: ${activeToolLabel}`;
    }
    return phaseLabel;
  }, [activeToolLabel, phase, phaseLabel]);

  // compact version for inline display
  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={cn(
          "inline-flex items-center gap-2 rounded-full px-3 py-1.5",
          "bg-muted/50 border-border/50 border",
          className,
        )}
      >
        <PhaseIcon phase={phase} isAnimated={isActive} />
        <span className="text-foreground text-xs font-medium">
          {displayLabel}
        </span>
        {duration !== null && duration > 0 && (
          <span className="text-muted-foreground text-[10px]">{duration}s</span>
        )}
      </motion.div>
    );
  }

  // full version with steps
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={cn(
        "rounded-lg border",
        "border-border/50 bg-muted/20 dark:bg-zinc-900/50",
        "overflow-hidden",
        className,
      )}
    >
      {/* header */}
      <div className="flex items-center gap-2 px-3 py-2">
        <PhaseIcon phase={phase} isAnimated={isActive} />
        <span className="text-foreground flex-1 text-xs font-medium">
          {displayLabel}
        </span>
        {duration !== null && duration > 0 && (
          <span className="text-muted-foreground text-[10px]">{duration}s</span>
        )}
      </div>

      {/* progress bar */}
      {showProgress && isActive && (
        <div className="border-border/30 border-t px-3 py-2">
          <FlowProgressBar
            progress={progress}
            label={progressLabel}
            isActive={isActive}
          />
        </div>
      )}

      {/* steps list */}
      {showSteps && steps.length > 0 && (
        <div className="border-border/30 space-y-1 border-t px-3 py-2">
          {steps.slice(-5).map((step, idx) => (
            <FlowStepItem
              key={step.id}
              label={step.label}
              status={step.status}
              isLast={idx === steps.length - 1}
            />
          ))}
        </div>
      )}

      {/* tool executions */}
      {toolExecutions.length > 0 && (
        <div className="border-border/30 space-y-1 border-t px-3 py-2">
          <p className="text-muted-foreground mb-1 text-[10px] tracking-wider uppercase">
            Actions
          </p>
          {toolExecutions.slice(-4).map((tool) => (
            <div
              key={tool.id}
              className="flex items-center gap-2 overflow-hidden"
            >
              <StatusDot status={tool.status} />
              <span
                className={cn(
                  "truncate text-xs",
                  tool.status === "active" && "text-foreground",
                  tool.status === "complete" && "text-muted-foreground",
                  tool.status === "error" && "text-destructive",
                )}
              >
                {truncateText(tool.displayName, 18)}
              </span>
              {tool.status === "active" && (
                <Loader2 className="text-primary h-3 w-3 animate-spin" />
              )}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
});

// inline compact indicator for chat messages
export const InlineFlowIndicator = memo(function InlineFlowIndicator({
  className,
}: {
  className?: string;
}) {
  const { phase, isActive, currentTool, duration } = useAgentFlow();

  if (!isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className={cn("flex items-center gap-2 py-1", className)}
    >
      <Loader2 className="text-primary h-3.5 w-3.5 animate-spin" />
      <span className="text-muted-foreground text-xs">
        {currentTool?.displayName || PHASE_LABELS[phase]}
      </span>
      {duration !== null && duration > 0 && (
        <span className="text-muted-foreground/60 text-[10px]">
          ({duration}s)
        </span>
      )}
    </motion.div>
  );
});

// phase timeline for showing all phases
export const FlowTimeline = memo(function FlowTimeline({
  className,
}: {
  className?: string;
}) {
  const { phase, isActive } = useAgentFlow();

  const phases: AgentPhase[] = [
    "analyzing",
    "planning",
    "executing",
    "verifying",
    "completed",
  ];

  const currentIndex = phases.indexOf(phase);

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {phases.map((p, idx) => {
        const isPast = idx < currentIndex;
        const isCurrent = idx === currentIndex;
        const isFuture = idx > currentIndex;

        return (
          <div key={p} className="flex items-center">
            <div
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full transition-all",
                isPast && "bg-emerald-500/20",
                isCurrent && isActive && "bg-primary/20",
                isCurrent && !isActive && "bg-muted",
                isFuture && "bg-muted/50",
              )}
            >
              {isPast ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              ) : isCurrent ? (
                <PhaseIcon phase={p} isAnimated={isActive} />
              ) : (
                <Circle className="text-muted-foreground/30 h-3 w-3" />
              )}
            </div>
            {idx < phases.length - 1 && (
              <div
                className={cn(
                  "h-0.5 w-4",
                  isPast && "bg-emerald-500/50",
                  isCurrent && "bg-primary/30",
                  isFuture && "bg-muted",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
});
