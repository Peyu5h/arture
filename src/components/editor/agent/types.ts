export type MessageRole = "user" | "assistant" | "system";

export type MessageStatus = "pending" | "streaming" | "complete" | "error";

export type ActionType =
  | "spawn_shape"
  | "add_text"
  | "move_element"
  | "modify_element"
  | "resize_element"
  | "delete_element"
  | "select_element"
  | "search_images"
  | "add_image_to_canvas"
  | "remove_background"
  | "change_canvas_background"
  | "change_layer_order"
  | "duplicate_element"
  | "ask_clarification";

export type MentionType =
  | "element"
  | "layer"
  | "color"
  | "asset"
  | "conversation"
  | "canvas"
  | "text"
  | "image"
  | "shape";

export interface AgentAction {
  id: string;
  type: ActionType | string;
  description?: string;
  status?: "pending" | "running" | "complete" | "error";
  timestamp?: number;
  payload?: Record<string, unknown>;
}

export interface ElementReference {
  id: string;
  type: string;
  name: string;
  thumbnail?: string;
  text?: string;
  imageSrc?: string;
  fill?: string;
  isOnCanvas: boolean;
}

export interface Mention {
  id: string;
  type: MentionType;
  label: string;
  data?: Record<string, unknown>;
  elementRef?: ElementReference;
  isOnCanvas?: boolean;
}

export interface MentionSuggestion {
  id: string;
  type: MentionType;
  label: string;
  description?: string;
  icon?: string;
  thumbnail?: string;
  data?: Record<string, unknown>;
  elementRef?: ElementReference;
}

export interface ImageAttachmentRef {
  id: string;
  name: string;
  url?: string;
  thumbnail?: string;
  dataUrl?: string;
}

export interface AgentMessage {
  id: string;
  role: MessageRole;
  content: string;
  status: MessageStatus;
  timestamp: number;
  actions?: AgentAction[];
  mentions?: Mention[];
  context?: MessageContext;
  imageAttachments?: ImageAttachmentRef[];
}

export interface MessageContext {
  elements?: Array<{
    id: string;
    type: string;
    name?: string;
    text?: string;
    imageSrc?: string;
  }>;
  canvasSnapshot?: string;
  summary?: string;
  imageAttachments?: ImageAttachmentRef[];
}

export interface Suggestion {
  id: string;
  label: string;
  prompt: string;
  category: "style" | "layout" | "content" | "generate";
  icon?: string;
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

export interface Conversation {
  id: string;
  title: string;
  projectId?: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
  preview?: string;
}

export interface ContextStats {
  totalTokens: number;
  formattedTokens: string;
  elementTokens: number;
  messageTokens: number;
  mentionTokens: number;
  systemPromptTokens?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface AgentPanelProps {
  editor: any;
  isOpen: boolean;
  onToggle: () => void;
  projectId?: string;
}

export interface AgentChatProps {
  messages: AgentMessage[];
  isLoading: boolean;
}

export interface AgentInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onMentionSelect?: (mention: MentionSuggestion) => void;
  isLoading: boolean;
  disabled?: boolean;
  mentions?: Mention[];
  mentionSuggestions?: MentionSuggestion[];
  onMentionSearch?: (query: string) => void;
  contextStats?: ContextStats;
  onInspectToggle?: () => void;
  isInspectMode?: boolean;
  onRemoveMention?: (id: string) => void;
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

export interface ConversationListProps {
  conversations: Conversation[];
  activeId?: string;
  onSelect: (id: string) => void;
  onNew: () => void;
}

export interface AgentHeaderProps {
  onClose: () => void;
  onClearHistory?: () => void;
  onNewChat?: () => void;
  onShowHistory?: () => void;
  messageCount?: number;
  conversationTitle?: string;
  contextStats?: ContextStats;
}

export interface InspectModeState {
  isActive: boolean;
  hoveredElement: ElementReference | null;
}

export interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: Conversation[];
  activeId?: string;
  onSelect: (id: string) => void;
  onDelete?: (id: string) => void;
}
