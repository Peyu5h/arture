"use client";

import { useState, useCallback, useEffect, useRef, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Brain,
  Play,
  Search,
  Type,
  Image,
  Palette,
  Move,
  Square,
  Layers,
  ChevronDown,
  ChevronRight,
  Wand2,
  FileText,
  LayoutGrid,
  Zap,
} from "lucide-react";
import { cn } from "~/lib/utils";
import { Shimmer } from "~/components/ai-elements/shimmer";
import { DemoCollectForm } from "./demo-collect-form";
import type {
  DemoPreset,
  DemoStep,
  DemoAnalyzePhrase,
  DemoFlowState,
  DemoExecutionEvent,
} from "~/lib/ai/demos/types";

// execution phase for the flow
type FlowPhase = "idle" | "analyzing" | "collecting" | "building" | "complete" | "error";

// individual step display state
interface StepDisplayState {
  id: string;
  label: string;
  description: string;
  toolName: string;
  status: "pending" | "thinking" | "executing" | "complete" | "error";
  thinkingText?: string;
  startTime?: number;
  endTime?: number;
}

// tool name to icon mapping
const TOOL_ICONS: Record<string, React.ReactNode> = {
  apply_gradient_background: <Palette className="h-3.5 w-3.5" />,
  change_canvas_background: <Palette className="h-3.5 w-3.5" />,
  load_font: <FileText className="h-3.5 w-3.5" />,
  add_text: <Type className="h-3.5 w-3.5" />,
  search_images: <Search className="h-3.5 w-3.5" />,
  add_image_to_canvas: <Image className="h-3.5 w-3.5" />,
  spawn_shape: <Square className="h-3.5 w-3.5" />,
  move_element: <Move className="h-3.5 w-3.5" />,
  modify_element: <Palette className="h-3.5 w-3.5" />,
  resize_element: <LayoutGrid className="h-3.5 w-3.5" />,
  finalize_layout: <Layers className="h-3.5 w-3.5" />,
};

function getToolIcon(toolName: string) {
  return TOOL_ICONS[toolName] || <Wand2 className="h-3.5 w-3.5" />;
}

// thinking phrases that cycle while a step is "thinking"
const THINKING_PHRASES = [
  "Considering design principles...",
  "Evaluating layout options...",
  "Choosing optimal placement...",
  "Analyzing visual hierarchy...",
  "Calculating proportions...",
  "Reviewing color harmony...",
  "Selecting best approach...",
  "Processing element data...",
];

function getThinkingPhrase(index: number): string {
  return THINKING_PHRASES[index % THINKING_PHRASES.length];
}

// status indicator for steps
const StepStatusIcon = memo(function StepStatusIcon({
  status,
}: {
  status: StepDisplayState["status"];
}) {
  switch (status) {
    case "pending":
      return <div className="h-3.5 w-3.5 rounded-full border-2 border-muted-foreground/20" />;
    case "thinking":
      return (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Brain className="h-3.5 w-3.5 text-amber-400" />
        </motion.div>
      );
    case "executing":
      return <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />;
    case "complete":
      return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
    case "error":
      return <AlertCircle className="h-3.5 w-3.5 text-destructive" />;
  }
});

// single step row
const StepRow = memo(function StepRow({ step }: { step: StepDisplayState }) {
  const isActive = step.status === "thinking" || step.status === "executing";
  const elapsed =
    step.startTime && step.endTime ? step.endTime - step.startTime : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "flex items-start gap-2.5 rounded-md px-2.5 py-2 transition-colors",
        isActive && "bg-muted/40",
      )}
    >
      <div className="mt-0.5 shrink-0">
        <StepStatusIcon status={step.status} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground/60 shrink-0">
            {getToolIcon(step.toolName)}
          </span>
          <span
            className={cn(
              "truncate text-xs font-medium",
              isActive ? "text-foreground" : "text-foreground/80",
              step.status === "pending" && "text-muted-foreground/50",
            )}
          >
            {step.label}
          </span>
          {elapsed !== null && step.status === "complete" && (
            <span className="ml-auto shrink-0 text-[10px] text-muted-foreground/40">
              {elapsed}ms
            </span>
          )}
        </div>

        {/* thinking / executing sub text */}
        <AnimatePresence>
          {step.status === "thinking" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
            >
              <p className="mt-0.5 text-[10px] text-amber-400/80 italic">
                {step.thinkingText || step.description}
              </p>
            </motion.div>
          )}
          {step.status === "executing" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
            >
              <p className="mt-0.5 text-[10px] text-primary/70">
                {step.description}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});

// analyzing phase overlay
function AnalyzingPhase({
  phrases,
  currentIndex,
}: {
  phrases: DemoAnalyzePhrase[];
  currentIndex: number;
}) {
  const current = phrases[Math.min(currentIndex, phrases.length - 1)];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center gap-4 py-6"
    >
      {/* pulsing brain icon */}
      <motion.div
        className="relative flex h-12 w-12 items-center justify-center"
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="absolute inset-0 rounded-full bg-primary/10 blur-md" />
        <div className="relative flex h-10 w-10 items-center justify-center rounded-full border border-primary/20 bg-card/80">
          <Brain className="h-5 w-5 text-primary" />
        </div>
      </motion.div>

      {/* animated phrase */}
      <div className="flex flex-col items-center gap-1.5">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            <Shimmer className="text-sm font-medium" duration={1.5}>
              {current?.text || "Thinking..."}
            </Shimmer>
          </motion.div>
        </AnimatePresence>

        {/* progress dots */}
        <div className="flex gap-1.5 pt-1">
          {phrases.map((_, idx) => (
            <motion.div
              key={idx}
              className={cn(
                "h-1 rounded-full transition-all duration-300",
                idx <= currentIndex
                  ? "w-4 bg-primary"
                  : "w-1.5 bg-muted-foreground/20",
              )}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// building phase - shows steps list with live progress
function BuildingPhase({
  steps,
  progress,
  isExpanded,
  onToggleExpand,
}: {
  steps: StepDisplayState[];
  progress: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) {
  const completedCount = steps.filter((s) => s.status === "complete").length;
  const activeStep = steps.find(
    (s) => s.status === "thinking" || s.status === "executing",
  );
  const hasError = steps.some((s) => s.status === "error");
  const isComplete = completedCount === steps.length;

  return (
    <div className="space-y-2">
      {/* header bar */}
      <button
        type="button"
        onClick={onToggleExpand}
        className="flex w-full items-center gap-2 rounded-lg border border-border/40 bg-muted/20 px-3 py-2 text-left transition-colors hover:bg-muted/40"
      >
        {isComplete ? (
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
        ) : hasError ? (
          <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
        ) : (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-foreground">
            {isComplete
              ? "Design created successfully"
              : activeStep
                ? activeStep.label
                : "Preparing..."}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {completedCount} / {steps.length} steps
          </p>
        </div>

        {/* progress ring */}
        <div className="relative h-7 w-7 shrink-0">
          <svg className="h-7 w-7 -rotate-90" viewBox="0 0 28 28">
            <circle
              cx="14"
              cy="14"
              r="11"
              fill="none"
              strokeWidth="2.5"
              className="stroke-muted/40"
            />
            <circle
              cx="14"
              cy="14"
              r="11"
              fill="none"
              strokeWidth="2.5"
              strokeLinecap="round"
              className="stroke-primary transition-all duration-500"
              strokeDasharray={`${2 * Math.PI * 11}`}
              strokeDashoffset={`${2 * Math.PI * 11 * (1 - progress / 100)}`}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-foreground/70">
            {Math.round(progress)}
          </span>
        </div>

        <span className="text-muted-foreground/40">
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </span>
      </button>

      {/* expanded step list */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden rounded-lg border border-border/30 bg-muted/10"
          >
            <div className="max-h-[280px] overflow-y-auto py-1 scrollbar-thin">
              {steps.map((step) => (
                <StepRow key={step.id} step={step} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// completion banner
function CompleteBanner({ totalTimeMs }: { totalTimeMs: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10">
        <Zap className="h-4 w-4 text-emerald-500" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">
          Design created!
        </p>
        <p className="text-[10px] text-muted-foreground">
          Completed in {(totalTimeMs / 1000).toFixed(1)}s
        </p>
      </div>
    </motion.div>
  );
}

// main props
interface DemoFlowExecutorProps {
  preset: DemoPreset;
  onStepExecute?: (step: DemoStep, collectedData: Record<string, unknown>) => Promise<void>;
  onComplete?: (collectedData: Record<string, unknown>) => void;
  onCancel?: () => void;
  className?: string;
  accentColor?: string;
}

export function DemoFlowExecutor({
  preset,
  onStepExecute,
  onComplete,
  onCancel,
  className,
  accentColor,
}: DemoFlowExecutorProps) {
  const [phase, setPhase] = useState<FlowPhase>("analyzing");
  const [analyzeIndex, setAnalyzeIndex] = useState(0);
  const [collectedData, setCollectedData] = useState<Record<string, unknown>>({});
  const [steps, setSteps] = useState<StepDisplayState[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isExpanded, setIsExpanded] = useState(true);
  const [startTime] = useState(Date.now());
  const [endTime, setEndTime] = useState<number | null>(null);
  const abortRef = useRef(false);
  const thinkingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // progress calculation
  const totalSteps = preset.steps.length;
  const completedSteps = steps.filter((s) => s.status === "complete").length;
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  // analyzing phase - cycle through phrases with debounced timing
  useEffect(() => {
    if (phase !== "analyzing") return;

    let currentIdx = 0;
    const phrases = preset.analyzePhrases;

    const advancePhrase = () => {
      currentIdx++;
      if (currentIdx >= phrases.length) {
        setPhase("collecting");
        return;
      }
      setAnalyzeIndex(currentIdx);
      setTimeout(advancePhrase, phrases[currentIdx].durationMs);
    };

    const firstTimeout = setTimeout(
      advancePhrase,
      phrases[0]?.durationMs || 1000,
    );

    return () => clearTimeout(firstTimeout);
  }, [phase, preset.analyzePhrases]);

  // handle form submission -> start building
  const handleCollectSubmit = useCallback(
    (data: Record<string, unknown>) => {
      setCollectedData(data);
      setPhase("building");

      // initialize step display states
      const displaySteps: StepDisplayState[] = preset.steps.map((s) => ({
        id: s.id,
        label: s.label,
        description: s.description,
        toolName: s.toolName,
        status: "pending",
      }));
      setSteps(displaySteps);
      setCurrentStepIndex(0);
    },
    [preset.steps],
  );

  // debounced sleep util
  const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

  // execute steps sequentially with thinking delays
  useEffect(() => {
    if (phase !== "building" || currentStepIndex < 0) return;
    if (currentStepIndex >= preset.steps.length) {
      setPhase("complete");
      setEndTime(Date.now());
      onComplete?.(collectedData);
      return;
    }

    const step = preset.steps[currentStepIndex];
    let canceled = false;

    const runStep = async () => {
      // set thinking state with cycling phrases
      setSteps((prev) =>
        prev.map((s, i) =>
          i === currentStepIndex
            ? {
                ...s,
                status: "thinking",
                startTime: Date.now(),
                thinkingText: getThinkingPhrase(currentStepIndex),
              }
            : s,
        ),
      );

      // cycle thinking phrases during wait
      let phraseIdx = 0;
      thinkingIntervalRef.current = setInterval(() => {
        phraseIdx++;
        setSteps((prev) =>
          prev.map((s, i) =>
            i === currentStepIndex && s.status === "thinking"
              ? { ...s, thinkingText: getThinkingPhrase(currentStepIndex + phraseIdx) }
              : s,
          ),
        );
      }, 800);

      // simulate thinking duration with debounce feel
      await sleep(step.thinkingDurationMs + Math.random() * 200);

      if (canceled) return;

      // clear thinking interval
      if (thinkingIntervalRef.current) {
        clearInterval(thinkingIntervalRef.current);
        thinkingIntervalRef.current = null;
      }

      // transition to executing
      setSteps((prev) =>
        prev.map((s, i) =>
          i === currentStepIndex ? { ...s, status: "executing", thinkingText: undefined } : s,
        ),
      );

      // execute the actual tool (or simulate)
      try {
        if (onStepExecute) {
          await onStepExecute(step, collectedData);
        } else {
          await sleep(step.executionDurationMs + Math.random() * 150);
        }
      } catch (err) {
        if (!canceled) {
          setSteps((prev) =>
            prev.map((s, i) =>
              i === currentStepIndex
                ? { ...s, status: "error", endTime: Date.now() }
                : s,
            ),
          );
        }
        return;
      }

      if (canceled) return;

      // mark complete
      setSteps((prev) =>
        prev.map((s, i) =>
          i === currentStepIndex
            ? { ...s, status: "complete", endTime: Date.now() }
            : s,
        ),
      );

      // small pause between steps for visual feedback
      await sleep(120);

      if (!canceled) {
        setCurrentStepIndex((idx) => idx + 1);
      }
    };

    runStep();

    return () => {
      canceled = true;
      if (thinkingIntervalRef.current) {
        clearInterval(thinkingIntervalRef.current);
        thinkingIntervalRef.current = null;
      }
    };
  }, [phase, currentStepIndex, preset.steps, collectedData, onStepExecute, onComplete]);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current = true;
      if (thinkingIntervalRef.current) {
        clearInterval(thinkingIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className={cn("w-full space-y-3", className)}>
      <AnimatePresence mode="wait">
        {/* analyzing phase */}
        {phase === "analyzing" && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            <AnalyzingPhase
              phrases={preset.analyzePhrases}
              currentIndex={analyzeIndex}
            />
          </motion.div>
        )}

        {/* collecting phase */}
        {phase === "collecting" && (
          <motion.div
            key="collecting"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <DemoCollectForm
              config={preset.collectConfig}
              onSubmit={handleCollectSubmit}
              onCancel={onCancel}
              accentColor={accentColor}
            />
          </motion.div>
        )}

        {/* building phase */}
        {(phase === "building" || phase === "complete") && (
          <motion.div
            key="building"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-3"
          >
            <BuildingPhase
              steps={steps}
              progress={progress}
              isExpanded={isExpanded}
              onToggleExpand={() => setIsExpanded((e) => !e)}
            />

            {phase === "complete" && endTime && (
              <CompleteBanner totalTimeMs={endTime - startTime} />
            )}
          </motion.div>
        )}

        {/* error state */}
        {phase === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3"
          >
            <AlertCircle className="h-4 w-4 text-destructive" />
            <p className="text-xs text-destructive">
              Something went wrong during design creation. Please try again.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default DemoFlowExecutor;
