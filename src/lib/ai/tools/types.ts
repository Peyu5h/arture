// tool types for ai agent

import { PositionPreset } from "../types";

export type ToolCategory = "canvas" | "assets" | "smart" | "query";

// re-export for convenience
export type { PositionPreset };

export type ToolStatus = "pending" | "running" | "success" | "error";

export interface ToolParameter {
  type: "string" | "number" | "boolean" | "object" | "array";
  description: string;
  required?: boolean;
  enum?: string[];
  default?: unknown;
  properties?: Record<string, ToolParameter>;
  items?: ToolParameter;
}

export interface ToolSchema {
  type: "object";
  properties: Record<string, ToolParameter>;
  required?: string[];
}

export interface ToolContext {
  canvas: fabric.Canvas | null;
  editor: EditorInstance | null;
  projectId?: string;
  userId?: string;
  selectedElementId?: string;
  workspaceBounds?: WorkspaceBounds;
}

export interface WorkspaceBounds {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface EditorInstance {
  canvas: fabric.Canvas;
  addText: (text: string, options?: TextOptions) => void;
  addImage: (url: string) => void;
  addCircle: () => void;
  addRectangle: () => void;
  addTriangle: () => void;
  addStar: () => void;
  addHexagon: () => void;
  addPentagon: () => void;
  addHeart: () => void;
  addOctagon: () => void;
  addDiamond: () => void;
  addLine: () => void;
  addArrow: () => void;
  changeFillColor: (color: string) => void;
  changeStrokeColor: (color: string) => void;
  changeStrokeWidth: (width: number) => void;
  changeOpacity: (opacity: number) => void;
  changeFontFamily: (family: string) => void;
  changeFontSize: (size: number) => void;
  changeFontWeight: (weight: number) => void;
  changeTextAlign: (align: string) => void;
  changeFontUnderline: (underline: boolean) => void;
  changeFontLinethrough: (linethrough: boolean) => void;
  changeFontStyle: (style: string) => void;
  delete: () => void;
  bringForward: () => void;
  sendBackward: () => void;
  getWorkspace: () => fabric.Object | undefined;
  autoZoom: () => void;
  undo: () => void;
  redo: () => void;
  save: () => void;
}

export interface TextOptions {
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  fill?: string;
  textAlign?: string;
}

export interface ToolResult {
  success: boolean;
  message: string;
  data?: unknown;
  error?: string;
  elementId?: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  category: ToolCategory;
  parameters: ToolSchema;
  execute: (
    params: Record<string, unknown>,
    context: ToolContext,
  ) => Promise<ToolResult>;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolExecutionResult {
  toolCallId: string;
  toolName: string;
  result: ToolResult;
  status: ToolStatus;
  executionTime: number;
}

// asset search types
export interface AssetSearchResult {
  id: string;
  url: string;
  thumbnail: string;
  preview?: string;
  width: number;
  height: number;
  source: "pixabay" | "pexels" | "unsplash";
  tags?: string[];
  author?: string;
  alt?: string;
}

export interface ImageSearchParams {
  query: string;
  source?: "pixabay" | "pexels" | "all";
  page?: number;
  perPage?: number;
  imageType?: "all" | "photo" | "illustration" | "vector";
}

export interface AddImageParams {
  url: string;
  position?: PositionPreset | { x: number; y: number };
  width?: number;
  height?: number;
  name?: string;
}

export interface RemoveBackgroundParams {
  elementId?: string;
  elementQuery?: string;
}

// tool function schema for openai/gemini
export interface FunctionSchema {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<
      string,
      {
        type: string;
        description: string;
        enum?: string[];
        default?: unknown;
      }
    >;
    required?: string[];
  };
}

// image attachment types
export interface ImageAttachment {
  id: string;
  dataUrl?: string;
  cloudinaryUrl?: string;
  publicId?: string;
  name: string;
  width?: number;
  height?: number;
  size?: number;
  uploaded: boolean;
}

export interface ChatImageContext {
  attachments: ImageAttachment[];
  canvasImages: Array<{
    id: string;
    src: string;
    description?: string;
  }>;
}
