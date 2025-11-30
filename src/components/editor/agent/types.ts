export type MessageRole = "user" | "assistant" | "system";

export type MessageStatus = "pending" | "streaming" | "complete" | "error";

export type ActionType =
  | "modify_element"
  | "add_element"
  | "remove_element"
  | "change_style"
  | "fetch_assets"
  | "analyze_canvas"
  | "generate_suggestion";

export interface AgentAction {
  id: string;
  type: ActionType;
  description: string;
  status: "pending" | "running" | "complete" | "error";
  timestamp: number;
}

export interface AgentMessage {
  id: string;
  role: MessageRole;
  content: string;
  status: MessageStatus;
  timestamp: number;
  actions?: AgentAction[];
}

export interface Suggestion {
  id: string;
  label: string;
  prompt: string;
  category: "style" | "layout" | "content" | "generate";
}

export interface CanvasContext {
  elementCount: number;
  hasText: boolean;
  hasImages: boolean;
  hasShapes: boolean;
  selectedElement: {
    type: string;
    properties: Record<string, unknown>;
  } | null;
  canvasSize: {
    width: number;
    height: number;
  };
  backgroundColor: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface AgentPanelProps {
  editor: any;
  isOpen: boolean;
  onToggle: () => void;
}

export interface AgentChatProps {
  messages: AgentMessage[];
  isLoading: boolean;
}

export interface AgentInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  disabled?: boolean;
}

export interface AgentSuggestionsProps {
  suggestions: Suggestion[];
  onSelect: (suggestion: Suggestion) => void;
  context: CanvasContext | null;
}

export interface AgentMessageProps {
  message: AgentMessage;
}

export interface AgentActionIndicatorProps {
  action: AgentAction;
}

export interface AgentContextDisplayProps {
  context: CanvasContext | null;
  isAnalyzing: boolean;
}
