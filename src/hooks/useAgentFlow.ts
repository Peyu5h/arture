import { useCallback, useMemo } from "react";
import {
  useAgentFlowStore,
  AgentPhase,
  AgentStep,
  ToolExecution,
  CanvasTarget,
  FlowLogEntry,
  StepStatus,
  generateFlowId,
} from "~/store/agentFlowStore";

const formatToolName = (name: string): string => {
  return name.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
};

export interface UseAgentFlowReturn {
  // state
  phase: AgentPhase;
  isActive: boolean;
  steps: AgentStep[];
  currentStep: AgentStep | null;
  toolExecutions: ToolExecution[];
  currentTool: ToolExecution | null;
  canvasTargets: CanvasTarget[];
  logs: FlowLogEntry[];
  progress: number;
  progressLabel?: string;
  duration: number | null;
  error?: string;

  // flow control
  startFlow: (requestId?: string) => void;
  endFlow: (success?: boolean, error?: string) => void;
  resetFlow: () => void;

  // phase management
  setPhase: (phase: AgentPhase, label?: string) => void;

  // step management
  addStep: (step: Omit<AgentStep, "id" | "startTime">) => string;
  updateStep: (id: string, updates: Partial<AgentStep>) => void;
  completeStep: (id: string, success?: boolean) => void;

  // tool execution
  startTool: (toolName: string, input?: Record<string, unknown>) => string;
  completeTool: (id: string, output?: unknown, error?: string) => void;

  // canvas targeting
  setCanvasTarget: (target: CanvasTarget) => void;
  addCanvasTarget: (target: CanvasTarget) => void;
  clearCanvasTargets: () => void;

  // logging
  log: (
    message: string,
    level?: FlowLogEntry["level"],
    details?: string,
  ) => void;

  // progress
  setProgress: (progress: number, label?: string) => void;
}

export const useAgentFlow = (): UseAgentFlowReturn => {
  const { data, setData } = useAgentFlowStore();

  // computed values
  const currentStep = useMemo(() => {
    if (!data.currentStepId) return null;
    return data.steps.find((s) => s.id === data.currentStepId) || null;
  }, [data.currentStepId, data.steps]);

  const currentTool = useMemo(() => {
    if (!data.currentToolId) return null;
    return data.toolExecutions.find((t) => t.id === data.currentToolId) || null;
  }, [data.currentToolId, data.toolExecutions]);

  const duration = useMemo(() => {
    if (!data.startTime) return null;
    const end = data.endTime || Date.now();
    return Math.floor((end - data.startTime) / 1000);
  }, [data.startTime, data.endTime]);

  // flow control
  const startFlow = useCallback(
    (requestId?: string) => {
      const id = requestId || generateFlowId();
      setData((draft) => {
        draft.phase = "analyzing";
        draft.isActive = true;
        draft.steps = [];
        draft.currentStepId = null;
        draft.toolExecutions = [];
        draft.currentToolId = null;
        draft.canvasTargets = [];
        draft.logs = [];
        draft.progress = 0;
        draft.progressLabel = undefined;
        draft.startTime = Date.now();
        draft.endTime = null;
        draft.error = undefined;
        draft.requestId = id;
      });
    },
    [setData],
  );

  const endFlow = useCallback(
    (success = true, error?: string) => {
      setData((draft) => {
        draft.phase = success ? "completed" : "error";
        draft.isActive = false;
        draft.endTime = Date.now();
        draft.currentStepId = null;
        draft.currentToolId = null;
        draft.canvasTargets = [];
        draft.progress = 100;
        if (error) draft.error = error;
      });
    },
    [setData],
  );

  const resetFlow = useCallback(() => {
    setData((draft) => {
      draft.phase = "idle";
      draft.isActive = false;
      draft.steps = [];
      draft.currentStepId = null;
      draft.toolExecutions = [];
      draft.currentToolId = null;
      draft.canvasTargets = [];
      draft.logs = [];
      draft.progress = 0;
      draft.progressLabel = undefined;
      draft.startTime = null;
      draft.endTime = null;
      draft.error = undefined;
      draft.requestId = null;
    });
  }, [setData]);

  // phase management
  const setPhase = useCallback(
    (phase: AgentPhase, label?: string) => {
      setData((draft) => {
        draft.phase = phase;
        if (label) draft.progressLabel = label;
      });
    },
    [setData],
  );

  // step management
  const addStep = useCallback(
    (step: Omit<AgentStep, "id" | "startTime">): string => {
      const id = generateFlowId();
      setData((draft) => {
        draft.steps.push({
          ...step,
          id,
          startTime: Date.now(),
        });
        draft.currentStepId = id;
      });
      return id;
    },
    [setData],
  );

  const updateStep = useCallback(
    (id: string, updates: Partial<AgentStep>) => {
      setData((draft) => {
        const step = draft.steps.find((s) => s.id === id);
        if (step) {
          Object.assign(step, updates);
        }
      });
    },
    [setData],
  );

  const completeStep = useCallback(
    (id: string, success = true) => {
      setData((draft) => {
        const step = draft.steps.find((s) => s.id === id);
        if (step) {
          step.status = success ? "complete" : "error";
          step.endTime = Date.now();
        }
        if (draft.currentStepId === id) {
          draft.currentStepId = null;
        }
      });
    },
    [setData],
  );

  // tool execution
  const startTool = useCallback(
    (toolName: string, input?: Record<string, unknown>): string => {
      const id = generateFlowId();
      setData((draft) => {
        draft.toolExecutions.push({
          id,
          toolName,
          displayName: formatToolName(toolName),
          status: "active",
          startTime: Date.now(),
          input,
        });
        draft.currentToolId = id;
        draft.phase = "executing";
      });
      return id;
    },
    [setData],
  );

  const completeTool = useCallback(
    (id: string, output?: unknown, error?: string) => {
      setData((draft) => {
        const tool = draft.toolExecutions.find((t) => t.id === id);
        if (tool) {
          tool.status = error ? "error" : "complete";
          tool.endTime = Date.now();
          tool.output = output;
          tool.error = error;
        }
        if (draft.currentToolId === id) {
          draft.currentToolId = null;
        }
      });
    },
    [setData],
  );

  // canvas targeting
  const setCanvasTarget = useCallback(
    (target: CanvasTarget) => {
      setData((draft) => {
        draft.canvasTargets = [target];
      });
    },
    [setData],
  );

  const addCanvasTarget = useCallback(
    (target: CanvasTarget) => {
      setData((draft) => {
        draft.canvasTargets.push(target);
      });
    },
    [setData],
  );

  const clearCanvasTargets = useCallback(() => {
    setData((draft) => {
      draft.canvasTargets = [];
    });
  }, [setData]);

  // logging
  const log = useCallback(
    (
      message: string,
      level: FlowLogEntry["level"] = "info",
      details?: string,
    ) => {
      setData((draft) => {
        draft.logs.push({
          id: generateFlowId(),
          timestamp: Date.now(),
          level,
          message,
          details,
        });
      });
    },
    [setData],
  );

  // progress
  const setProgress = useCallback(
    (progress: number, label?: string) => {
      setData((draft) => {
        draft.progress = Math.max(0, Math.min(100, progress));
        if (label !== undefined) draft.progressLabel = label;
      });
    },
    [setData],
  );

  return {
    // state
    phase: data.phase,
    isActive: data.isActive,
    steps: data.steps,
    currentStep,
    toolExecutions: data.toolExecutions,
    currentTool,
    canvasTargets: data.canvasTargets,
    logs: data.logs,
    progress: data.progress,
    progressLabel: data.progressLabel,
    duration,
    error: data.error,

    // flow control
    startFlow,
    endFlow,
    resetFlow,

    // phase management
    setPhase,

    // step management
    addStep,
    updateStep,
    completeStep,

    // tool execution
    startTool,
    completeTool,

    // canvas targeting
    setCanvasTarget,
    addCanvasTarget,
    clearCanvasTargets,

    // logging
    log,

    // progress
    setProgress,
  };
};
