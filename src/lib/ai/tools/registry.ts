// tool registry for managing ai agent tools

import {
  ToolDefinition,
  ToolContext,
  ToolResult,
  ToolExecutionResult,
  ToolCall,
  FunctionSchema,
} from "./types";
import { allToolSchemas, generateToolsDescription } from "./schemas";
import { toolExecutors, executeTool } from "./editor-bridge";
import { assetToolExecutors } from "./asset-tools";
import { CanvasIndex } from "../types";

// generate unique id
const generateId = () => Math.random().toString(36).substring(2, 10);

// combined tool executors
const allToolExecutors: Record<
  string,
  (
    params: Record<string, unknown>,
    context: ToolContext,
    canvasIndex?: CanvasIndex
  ) => Promise<ToolResult>
> = {
  ...toolExecutors,
  ...assetToolExecutors,
};

// tool registry class
export class ToolRegistry {
  private tools: Map<string, FunctionSchema> = new Map();
  private executors: Map<
    string,
    (
      params: Record<string, unknown>,
      context: ToolContext,
      canvasIndex?: CanvasIndex
    ) => Promise<ToolResult>
  > = new Map();

  constructor() {
    this.registerDefaultTools();
  }

  // register default tools
  private registerDefaultTools(): void {
    allToolSchemas.forEach((schema) => {
      this.tools.set(schema.name, schema);
    });

    Object.entries(allToolExecutors).forEach(([name, executor]) => {
      this.executors.set(name, executor);
    });
  }

  // register a custom tool
  registerTool(
    schema: FunctionSchema,
    executor: (
      params: Record<string, unknown>,
      context: ToolContext,
      canvasIndex?: CanvasIndex
    ) => Promise<ToolResult>
  ): void {
    this.tools.set(schema.name, schema);
    this.executors.set(schema.name, executor);
  }

  // unregister a tool
  unregisterTool(name: string): boolean {
    const schemaDeleted = this.tools.delete(name);
    const executorDeleted = this.executors.delete(name);
    return schemaDeleted || executorDeleted;
  }

  // get tool schema by name
  getTool(name: string): FunctionSchema | undefined {
    return this.tools.get(name);
  }

  // get all tool schemas
  getAllTools(): FunctionSchema[] {
    return Array.from(this.tools.values());
  }

  // get tools by category
  getToolsByCategory(category: "canvas" | "assets" | "smart"): FunctionSchema[] {
    const canvasTools = [
      "spawn_shape",
      "add_text",
      "move_element",
      "modify_element",
      "resize_element",
      "delete_element",
      "select_element",
      "modify_text",
      "change_layer_order",
      "change_canvas_background",
      "duplicate_element",
    ];

    const assetTools = [
      "search_images",
      "add_image_to_canvas",
      "search_illustrations",
    ];

    const smartTools = ["remove_background"];

    let toolNames: string[];
    switch (category) {
      case "canvas":
        toolNames = canvasTools;
        break;
      case "assets":
        toolNames = assetTools;
        break;
      case "smart":
        toolNames = smartTools;
        break;
      default:
        toolNames = [];
    }

    return toolNames
      .map((name) => this.tools.get(name))
      .filter((t): t is FunctionSchema => !!t);
  }

  // execute a tool
  async executeTool(
    name: string,
    params: Record<string, unknown>,
    context: ToolContext,
    canvasIndex?: CanvasIndex
  ): Promise<ToolResult> {
    const executor = this.executors.get(name);
    if (!executor) {
      return { success: false, message: `Unknown tool: ${name}` };
    }

    try {
      return await executor(params, context, canvasIndex);
    } catch (error) {
      return {
        success: false,
        message: `Tool execution error: ${error instanceof Error ? error.message : "Unknown error"}`,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // execute multiple tool calls
  async executeToolCalls(
    calls: ToolCall[],
    context: ToolContext,
    canvasIndex?: CanvasIndex
  ): Promise<ToolExecutionResult[]> {
    const results: ToolExecutionResult[] = [];

    for (const call of calls) {
      const startTime = Date.now();

      const result = await this.executeTool(
        call.name,
        call.arguments,
        context,
        canvasIndex
      );

      results.push({
        toolCallId: call.id,
        toolName: call.name,
        result,
        status: result.success ? "success" : "error",
        executionTime: Date.now() - startTime,
      });
    }

    return results;
  }

  // parse tool calls from AI response
  parseToolCalls(response: string): ToolCall[] {
    const calls: ToolCall[] = [];

    // look for json code blocks
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);

        // handle actions array format
        if (parsed.actions && Array.isArray(parsed.actions)) {
          parsed.actions.forEach((action: Record<string, unknown>) => {
            const toolName = this.mapActionTypeToToolName(action.type as string);
            if (toolName && this.tools.has(toolName)) {
              calls.push({
                id: (action.id as string) || generateId(),
                name: toolName,
                arguments: (action.payload as Record<string, unknown>) || action,
              });
            }
          });
        }

        // handle direct tool calls
        if (parsed.tool_calls && Array.isArray(parsed.tool_calls)) {
          parsed.tool_calls.forEach((call: Record<string, unknown>) => {
            if (this.tools.has(call.name as string)) {
              calls.push({
                id: (call.id as string) || generateId(),
                name: call.name as string,
                arguments: call.arguments as Record<string, unknown>,
              });
            }
          });
        }
      } catch {
        // json parse failed
      }
    }

    return calls;
  }

  // map legacy action types to tool names
  private mapActionTypeToToolName(actionType: string): string | null {
    const mapping: Record<string, string> = {
      spawn_shape: "spawn_shape",
      add_text: "add_text",
      move_element: "move_element",
      modify_element: "modify_element",
      resize_element: "resize_element",
      delete_element: "delete_element",
      select_element: "select_element",
      search_images: "search_images",
      add_image: "add_image_to_canvas",
      add_image_to_canvas: "add_image_to_canvas",
      remove_background: "remove_background",
      change_layer_order: "change_layer_order",
      change_background: "change_canvas_background",
      change_canvas_background: "change_canvas_background",
      duplicate: "duplicate_element",
      duplicate_element: "duplicate_element",
    };

    return mapping[actionType] || null;
  }

  // generate system prompt section for tools
  generateToolsPrompt(): string {
    return generateToolsDescription();
  }

  // get function declarations for gemini
  getFunctionDeclarations(): Array<{
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  }> {
    return this.getAllTools().map((schema) => ({
      name: schema.name,
      description: schema.description,
      parameters: schema.parameters,
    }));
  }

  // check if tool exists
  hasTool(name: string): boolean {
    return this.tools.has(name);
  }

  // get tool count
  get toolCount(): number {
    return this.tools.size;
  }
}

// singleton instance
let registryInstance: ToolRegistry | null = null;

export function getToolRegistry(): ToolRegistry {
  if (!registryInstance) {
    registryInstance = new ToolRegistry();
  }
  return registryInstance;
}

// create new registry instance
export function createToolRegistry(): ToolRegistry {
  return new ToolRegistry();
}

// convenience exports
export { generateToolsDescription } from "./schemas";
