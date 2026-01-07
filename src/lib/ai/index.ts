// ai module exports

export * from "./types";
export * from "./canvas-indexer";
export * from "./canvas-actions";
export * from "./context-budget";
export * from "./action-parser";
export * from "./image-context";

// selective tool exports to avoid type conflicts
export {
  // registry
  getToolRegistry,
  createToolRegistry,
  ToolRegistry,
  // schemas
  allToolSchemas,
  generateToolsDescription,
  toGeminiFunctionDeclarations,
  // editor bridge
  executeTool,
  toolExecutors,
  // asset tools
  assetToolExecutors,
  uploadImageToCloudinary,
  uploadDataUrlToCloudinary,
} from "./tools";

// tool types (using distinct names to avoid conflicts with main types)
export type {
  ToolCategory,
  ToolStatus,
  ToolParameter,
  ToolSchema,
  ToolContext,
  WorkspaceBounds,
  EditorInstance,
  TextOptions as ToolTextOptions,
  ToolDefinition,
  AssetSearchResult,
  ImageSearchParams,
  AddImageParams,
  RemoveBackgroundParams,
  FunctionSchema,
  ChatImageContext,
} from "./tools";
