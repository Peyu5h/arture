export type DemoId = "satyanarayan_puja_home" | "satyanarayan_puja_society";

export type DemoLanguage = "english" | "marathi" | "hindi" | "mixed";

export type DemoLocationType = "home" | "society" | "temple" | "hall";

export type DemoStepType =
  | "analyze"
  | "collect_info"
  | "set_background"
  | "add_text"
  | "move_element"
  | "add_image"
  | "edit_text"
  | "resize_element"
  | "apply_font"
  | "finalize";

export type DemoStepStatus =
  | "pending"
  | "active"
  | "thinking"
  | "complete"
  | "error";

export interface DemoTextElement {
  id: string;
  text: string;
  fontSize: number;
  fontFamily: string;
  fontWeight?: number;
  fill: string;
  position: { x: number; y: number } | string;
  textAlign?: "left" | "center" | "right";
  lineHeight?: number;
  opacity?: number;
  charSpacing?: number;
  width?: number;
}

export interface DemoImageElement {
  id: string;
  query: string;
  url?: string;
  position: { x: number; y: number } | string;
  width?: number;
  height?: number;
  opacity?: number;
}

export interface DemoBackgroundConfig {
  type: "solid" | "gradient" | "image";
  color?: string;
  colors?: string[];
  direction?: "vertical" | "horizontal" | "diagonal";
  imageQuery?: string;
  imageUrl?: string;
}

export interface DemoStep {
  id: string;
  type: DemoStepType;
  label: string;
  description: string;
  toolName: string;
  toolArgs: Record<string, unknown>;
  thinkingDurationMs: number;
  executionDurationMs: number;
  dependsOn?: string;
}

export interface DemoCollectField {
  id: string;
  type: "text" | "select" | "date" | "time" | "toggle";
  label: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: unknown;
  options?: Array<{ value: string; label: string; icon?: string }>;
  group?: string;
}

export interface DemoCollectConfig {
  title: string;
  description: string;
  fields: DemoCollectField[];
  groups?: Array<{ id: string; label: string; icon?: string }>;
}

export interface DemoAnalyzePhrase {
  text: string;
  durationMs: number;
}

export interface DemoPreset {
  id: DemoId;
  name: string;
  description: string;
  prompt: string;
  language: DemoLanguage;
  locationType: DemoLocationType;

  analyzePhrases: DemoAnalyzePhrase[];
  collectConfig: DemoCollectConfig;

  canvasWidth: number;
  canvasHeight: number;
  background: DemoBackgroundConfig;
  steps: DemoStep[];
  textElements: DemoTextElement[];
  imageElements: DemoImageElement[];
}

export interface DemoFlowState {
  demoId: DemoId | null;
  phase: "idle" | "analyzing" | "collecting" | "building" | "complete";
  currentStepIndex: number;
  completedSteps: string[];
  collectedData: Record<string, unknown>;
  error?: string;
  startTime: number | null;
}

export interface DemoExecutionEvent {
  stepId: string;
  type: "thinking" | "tool_call" | "tool_result" | "complete";
  toolName?: string;
  toolArgs?: Record<string, unknown>;
  result?: unknown;
  timestamp: number;
}
