import { createGlobalState } from "./index";

// agent state machine states
export type AgentPhase =
  | "idle"
  | "analyzing"
  | "planning"
  | "executing"
  | "verifying"
  | "completed"
  | "error";

// step status for individual operations
export type StepStatus = "pending" | "active" | "complete" | "error" | "skipped";

// individual step in the agent flow
export interface AgentStep {
  id: string;
  phase: AgentPhase;
  label: string;
  description?: string;
  status: StepStatus;
  startTime: number;
  endTime?: number;
  metadata?: Record<string, unknown>;
  children?: AgentStep[];
}

// tool execution details
export interface ToolExecution {
  id: string;
  toolName: string;
  displayName: string;
  status: StepStatus;
  startTime: number;
  endTime?: number;
  input?: Record<string, unknown>;
  output?: unknown;
  error?: string;
}

// canvas targeting info
export interface CanvasTarget {
  elementId?: string;
  elementIds?: string[];
  region?: { x: number; y: number; width: number; height: number };
  type: "element" | "region" | "canvas" | "searching";
  label?: string;
}

// log entry for step viewer
export interface FlowLogEntry {
  id: string;
  timestamp: number;
  level: "info" | "action" | "success" | "error" | "warning";
  message: string;
  details?: string;
  icon?: string;
}

// main agent flow state
export interface AgentFlowState {
  // current phase
  phase: AgentPhase;
  isActive: boolean;

  // steps tracking
  steps: AgentStep[];
  currentStepId: string | null;

  // tool executions
  toolExecutions: ToolExecution[];
  currentToolId: string | null;

  // canvas targeting
  canvasTargets: CanvasTarget[];

  // logs
  logs: FlowLogEntry[];

  // progress
  progress: number;
  progressLabel?: string;

  // timing
  startTime: number | null;
  endTime: number | null;

  // error state
  error?: string;

  // request id for tracking
  requestId: string | null;
}

// initial state
const initialState: AgentFlowState = {
  phase: "idle",
  isActive: false,
  steps: [],
  currentStepId: null,
  toolExecutions: [],
  currentToolId: null,
  canvasTargets: [],
  logs: [],
  progress: 0,
  progressLabel: undefined,
  startTime: null,
  endTime: null,
  error: undefined,
  requestId: null,
};

// create global state hook
export const useAgentFlowStore = createGlobalState("agentFlow", initialState);

// helper to generate unique ids
export const generateFlowId = () =>
  `flow_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

// phase display labels
export const PHASE_LABELS: Record<AgentPhase, string> = {
  idle: "Thinking",
  analyzing: "Analyzing Canvas",
  planning: "Planning",
  executing: "Executing",
  verifying: "Verifying",
  completed: "Done",
  error: "Error",
};

// phase icons (lucide icon names)
export const PHASE_ICONS: Record<AgentPhase, string> = {
  idle: "circle",
  analyzing: "scan",
  planning: "brain",
  executing: "play",
  verifying: "check-circle",
  completed: "check-circle-2",
  error: "alert-circle",
};
