"use client";

import { memo, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "~/lib/utils";
import {
  Scan,
  Brain,
  Play,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Zap,
  Target,
  Search,
  Wand2,
} from "lucide-react";
import { useAgentFlow } from "~/hooks/useAgentFlow";
import { AgentPhase, PHASE_LABELS } from "~/store/agentFlowStore";
import { FlowTimeline } from "./agent-flow-indicator";

// phase configuration
const PHASE_CONFIG: Record<
  AgentPhase,
  {
    icon: typeof Scan;
    color: string;
    bgColor: string;
    description: string;
  }
> = {
  idle: {
    icon: Sparkles,
    color: "text-muted-foreground",
    bgColor: "bg-muted/50",
    description: "Ready to help",
  },
  analyzing: {
    icon: Scan,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    description: "Examining canvas elements",
  },
  planning: {
    icon: Brain,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    description: "Thinking about the best approach",
  },
  executing: {
    icon: Zap,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    description: "Making changes",
  },
  verifying: {
    icon: Target,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    description: "Checking results",
  },
  completed: {
    icon: CheckCircle2,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    description: "All done",
  },
  error: {
    icon: AlertCircle,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    description: "Something went wrong",
  },
};

// animated dots
const ThinkingDots = memo(function ThinkingDots({
  className,
}: {
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1 w-1 rounded-full bg-current"
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </span>
  );
});

// animated phase icon
const AnimatedPhaseIcon = memo(function AnimatedPhaseIcon({
  phase,
  size = "md",
}: {
  phase: AgentPhase;
  size?: "sm" | "md" | "lg";
}) {
  const config = PHASE_CONFIG[phase];
  const Icon = config.icon;

  const sizeClasses = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const isAnimating =
    phase === "analyzing" ||
    phase === "planning" ||
    phase === "executing" ||
    phase === "verifying";

  return (
    <motion.div
      className={cn(
        "relative flex items-center justify-center",
        config.color,
      )}
      animate={isAnimating ? { rotate: phase === "analyzing" ? 360 : 0 } : {}}
      transition={
        phase === "analyzing"
          ? { duration: 2, repeat: Infinity, ease: "linear" }
          : {}
      }
    >
      <Icon
        className={cn(
          sizeClasses[size],
          isAnimating && phase !== "analyzing" && "animate-pulse",
        )}
      />
      {isAnimating && (
        <motion.div
          className={cn(
            "absolute inset-0 rounded-full",
            config.bgColor,
          )}
          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
});

interface AgentThinkingIndicatorProps {
  className?: string;
  variant?: "default" | "compact" | "minimal" | "detailed";
  showTimeline?: boolean;
  showProgress?: boolean;
  showToolExecutions?: boolean;
}

// main thinking indicator
export const AgentThinkingIndicator = memo(function AgentThinkingIndicator({
  className,
  variant = "default",
  showTimeline = true,
  showProgress = true,
  showToolExecutions = true,
}: AgentThinkingIndicatorProps) {
  const {
    phase,
    isActive,
    currentTool,
    toolExecutions,
    progress,
    progressLabel,
    duration,
    logs,
  } = useAgentFlow();

  // don't show when idle
  if (phase === "idle" && !isActive) return null;

  const config = PHASE_CONFIG[phase];
  const displayLabel = currentTool?.displayName
    ? `${PHASE_LABELS[phase]}: ${currentTool.displayName}`
    : PHASE_LABELS[phase];

  // recent logs for detailed view
  const recentLogs = useMemo(() => logs.slice(-3), [logs]);

  // minimal variant - just a dot and label
  if (variant === "minimal") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={cn("inline-flex items-center gap-2", className)}
      >
        <motion.span
          className={cn("h-2 w-2 rounded-full", config.bgColor)}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <span className={cn("block h-full w-full rounded-full", config.color.replace("text-", "bg-"))} />
        </motion.span>
        <span className="text-muted-foreground text-xs">{displayLabel}</span>
      </motion.div>
    );
  }

  // compact variant - icon and label
  if (variant === "compact") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={cn(
          "inline-flex items-center gap-2 rounded-full px-3 py-1.5",
          config.bgColor,
          "border border-border/50",
          className,
        )}
      >
        <AnimatedPhaseIcon phase={phase} size="sm" />
        <span className="text-foreground text-xs font-medium">
          {displayLabel}
        </span>
        {isActive && <ThinkingDots className={config.color} />}
        {duration !== null && duration > 0 && (
          <span className="text-muted-foreground text-[10px]">{duration}s</span>
        )}
      </motion.div>
    );
  }

  // detailed variant - full panel with all info
  if (variant === "detailed") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className={cn(
          "rounded-lg border border-border/50",
          "bg-muted/20 dark:bg-zinc-900/50",
          "overflow-hidden",
          className,
        )}
      >
        {/* header */}
        <div className={cn("flex items-center gap-3 px-4 py-3", config.bgColor)}>
          <AnimatedPhaseIcon phase={phase} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="text-foreground text-sm font-medium">{displayLabel}</p>
            <p className="text-muted-foreground text-xs">{config.description}</p>
          </div>
          {duration !== null && duration > 0 && (
            <span className="text-muted-foreground text-xs tabular-nums">
              {duration}s
            </span>
          )}
        </div>

        {/* timeline */}
        {showTimeline && phase !== "idle" && phase !== "completed" && (
          <div className="border-border/30 border-t px-4 py-3">
            <FlowTimeline />
          </div>
        )}

        {/* progress */}
        {showProgress && isActive && progress > 0 && progress < 100 && (
          <div className="border-border/30 border-t px-4 py-3">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-muted-foreground text-xs">
                {progressLabel || "Processing..."}
              </span>
              <span className="text-muted-foreground text-xs tabular-nums">
                {progress}%
              </span>
            </div>
            <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
              <motion.div
                className="bg-primary h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}

        {/* tool executions */}
        {showToolExecutions && toolExecutions.length > 0 && (
          <div className="border-border/30 border-t px-4 py-3">
            <p className="text-muted-foreground mb-2 text-[10px] uppercase tracking-wider">
              Actions
            </p>
            <div className="space-y-1.5">
              {toolExecutions.slice(-4).map((tool) => (
                <div key={tool.id} className="flex items-center gap-2">
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      tool.status === "active" && "bg-primary animate-pulse",
                      tool.status === "complete" && "bg-emerald-500",
                      tool.status === "error" && "bg-destructive",
                      tool.status === "pending" && "bg-muted-foreground/30",
                    )}
                  />
                  <span
                    className={cn(
                      "text-xs",
                      tool.status === "active" && "text-foreground",
                      tool.status === "complete" && "text-muted-foreground",
                      tool.status === "error" && "text-destructive",
                      tool.status === "pending" && "text-muted-foreground/60",
                    )}
                  >
                    {tool.displayName}
                  </span>
                  {tool.status === "active" && (
                    <Loader2 className="text-primary h-3 w-3 animate-spin" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* recent logs */}
        {recentLogs.length > 0 && (
          <div className="border-border/30 border-t px-4 py-3">
            <div className="space-y-1">
              {recentLogs.map((log) => (
                <p
                  key={log.id}
                  className={cn(
                    "text-[11px]",
                    log.level === "error" && "text-destructive",
                    log.level === "success" && "text-emerald-500",
                    log.level === "warning" && "text-amber-500",
                    log.level === "action" && "text-primary",
                    log.level === "info" && "text-muted-foreground",
                  )}
                >
                  {log.message}
                </p>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    );
  }

  // default variant
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "rounded-lg border border-border/50",
        config.bgColor,
        "px-4 py-3",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <AnimatedPhaseIcon phase={phase} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-foreground text-sm font-medium">
              {displayLabel}
            </span>
            {isActive && <ThinkingDots className={config.color} />}
          </div>
          {isActive && progressLabel && (
            <p className="text-muted-foreground mt-0.5 text-xs">
              {progressLabel}
            </p>
          )}
        </div>
        {duration !== null && duration > 0 && (
          <span className="text-muted-foreground text-xs tabular-nums">
            {duration}s
          </span>
        )}
      </div>

      {/* progress bar */}
      {showProgress && isActive && progress > 0 && progress < 100 && (
        <div className="mt-2">
          <div className="bg-background/50 h-1 w-full overflow-hidden rounded-full">
            <motion.div
              className="bg-primary h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      )}

      {/* timeline */}
      {showTimeline && phase !== "idle" && phase !== "completed" && (
        <div className="mt-3">
          <FlowTimeline />
        </div>
      )}
    </motion.div>
  );
});

// standalone loading spinner with phase
export const PhaseSpinner = memo(function PhaseSpinner({
  phase,
  size = "md",
  className,
}: {
  phase: AgentPhase;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const config = PHASE_CONFIG[phase];

  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  const containerClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  return (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-full",
        config.bgColor,
        containerClasses[size],
        className,
      )}
    >
      <AnimatedPhaseIcon phase={phase} size={size} />
      {phase !== "idle" && phase !== "completed" && phase !== "error" && (
        <motion.div
          className={cn(
            "absolute inset-0 rounded-full border-2 border-transparent",
            `border-t-${config.color.replace("text-", "")}`,
          )}
          style={{
            borderTopColor: `var(--${config.color.replace("text-", "")})`,
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      )}
    </div>
  );
});
