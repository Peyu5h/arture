// tools module exports

export * from "./schemas";
export * from "./editor-bridge";
export * from "./asset-tools";
export * from "./registry";

// explicit type exports to avoid conflicts
export type {
  ToolCategory,
  ToolStatus,
  ToolParameter,
  ToolSchema,
  ToolContext,
  WorkspaceBounds,
  EditorInstance,
  TextOptions,
  ToolResult,
  ToolDefinition,
  ToolCall,
  ToolExecutionResult,
  AssetSearchResult,
  ImageSearchParams,
  AddImageParams,
  RemoveBackgroundParams,
  PositionPreset,
  FunctionSchema,
  ImageAttachment,
  ChatImageContext,
} from "./types";

// re-export commonly used items
export { getToolRegistry, createToolRegistry, ToolRegistry } from "./registry";
export {
  allToolSchemas,
  generateToolsDescription,
  toGeminiFunctionDeclarations,
} from "./schemas";
export { executeTool, toolExecutors } from "./editor-bridge";
export {
  assetToolExecutors,
  uploadImageToCloudinary,
  uploadDataUrlToCloudinary,
} from "./asset-tools";
