export type ElementType =
  | "textbox"
  | "text"
  | "i-text"
  | "image"
  | "rect"
  | "circle"
  | "triangle"
  | "polygon"
  | "path"
  | "line"
  | "group"
  | "unknown";

export type ShapeType =
  | "rectangle"
  | "circle"
  | "triangle"
  | "diamond"
  | "star"
  | "hexagon"
  | "pentagon"
  | "heart"
  | "octagon"
  | "line"
  | "arrow";

export type PositionPreset =
  | "center"
  | "top-left"
  | "top-center"
  | "top-right"
  | "middle-left"
  | "middle-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  w: number;
  h: number;
}

export interface IndexedElement {
  id: string;
  type: ElementType;
  position: Position;
  size: Size;
  layer: number;
  angle?: number;
  opacity?: number;
  text?: string;
  imageRef?: string;
  imageDesc?: string;
  shape?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  name?: string;
  fontFamily?: string;
  fontSize?: number;
  isSelected?: boolean;
}

export interface CanvasMetadata {
  width: number;
  height: number;
  background: string;
}

export interface TokenBudget {
  total: number;
  used: number;
  elements: number;
  messages: number;
  summary: number;
}

export interface CanvasIndex {
  version: string;
  timestamp: number;
  canvas: CanvasMetadata;
  elements: IndexedElement[];
  elementCount: number;
  summary: string;
  tokenBudget: TokenBudget;
}

export interface ShapeOptions {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  width?: number;
  height?: number;
  radius?: number;
  position?: Position | PositionPreset;
}

export interface SpawnShapePayload {
  shapeType: ShapeType;
  options?: ShapeOptions;
}

export interface MoveElementPayload {
  elementId?: string;
  elementQuery?: string;
  position: Position | PositionPreset;
}

export interface ModifyElementPayload {
  elementId?: string;
  elementQuery?: string;
  properties: Partial<{
    fill: string;
    stroke: string;
    strokeWidth: number;
    opacity: number;
    angle: number;
    scaleX: number;
    scaleY: number;
    text: string;
    fontSize: number;
    fontFamily: string;
  }>;
}

export interface DeleteElementPayload {
  elementId?: string;
  elementQuery?: string;
}

export interface ResizeElementPayload {
  elementId?: string;
  elementQuery?: string;
  width?: number;
  height?: number;
  scale?: number;
  increaseBy?: number;
  decreaseBy?: number;
}

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

export interface AgentActionBase {
  id: string;
  type: ActionType | string;
  description?: string;
  status?: "pending" | "running" | "complete" | "error";
  timestamp?: number;
}

export interface SpawnShapeAction extends AgentActionBase {
  type: "spawn_shape";
  payload: SpawnShapePayload | Record<string, unknown>;
}

export interface MoveElementAction extends AgentActionBase {
  type: "move_element";
  payload: MoveElementPayload | Record<string, unknown>;
}

export interface ModifyElementAction extends AgentActionBase {
  type: "modify_element";
  payload: ModifyElementPayload | Record<string, unknown>;
}

export interface DeleteElementAction extends AgentActionBase {
  type: "delete_element";
  payload: DeleteElementPayload | Record<string, unknown>;
}

export interface ResizeElementAction extends AgentActionBase {
  type: "resize_element";
  payload: ResizeElementPayload | Record<string, unknown>;
}

export interface SelectElementAction extends AgentActionBase {
  type: "select_element";
  payload:
    | { elementId?: string; elementQuery?: string }
    | Record<string, unknown>;
}

export interface AskClarificationAction extends AgentActionBase {
  type: "ask_clarification";
  payload: { question: string; options?: string[] } | Record<string, unknown>;
}

export interface AddTextAction extends AgentActionBase {
  type: "add_text";
  payload:
    | {
        text: string;
        fontSize?: number;
        fontFamily?: string;
        fill?: string;
        position?: PositionPreset | Position;
      }
    | Record<string, unknown>;
}

export interface ChangeCanvasBackgroundAction extends AgentActionBase {
  type: "change_canvas_background";
  payload:
    | {
        color: string;
      }
    | Record<string, unknown>;
}

export interface SearchImagesAction extends AgentActionBase {
  type: "search_images";
  payload:
    | {
        query: string;
        count?: number;
        source?: string;
      }
    | Record<string, unknown>;
}

export interface AddImageToCanvasAction extends AgentActionBase {
  type: "add_image_to_canvas";
  payload:
    | {
        url: string;
        position?: PositionPreset | Position;
      }
    | Record<string, unknown>;
}

export interface GenericAction extends AgentActionBase {
  type: string;
  payload: Record<string, unknown>;
}

export type AgentAction =
  | SpawnShapeAction
  | AddTextAction
  | MoveElementAction
  | ModifyElementAction
  | ResizeElementAction
  | DeleteElementAction
  | SelectElementAction
  | ChangeCanvasBackgroundAction
  | SearchImagesAction
  | AddImageToCanvasAction
  | AskClarificationAction
  | GenericAction;

export interface ParsedAIResponse {
  message: string;
  actions: AgentAction[];
  requiresClarification: boolean;
  clarificationQuestion?: string;
}

export interface PrunedContext {
  canvasIndex: CanvasIndex;
  messages: Array<{ role: string; content: string }>;
  totalTokens: number;
}

export interface ContextBudgetConfig {
  maxTokens: number;
  reserveForResponse: number;
  messagePriority: number;
  elementPriority: number;
  summaryPriority: number;
}

export const DEFAULT_BUDGET_CONFIG: ContextBudgetConfig = {
  maxTokens: 8000,
  reserveForResponse: 1000,
  messagePriority: 0.4,
  elementPriority: 0.35,
  summaryPriority: 0.25,
};
