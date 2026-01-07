// hook for executing ai tools on canvas

import { useCallback, useMemo } from "react";
import { fabric } from "fabric";
import { getToolRegistry } from "~/lib/ai/tools";
import type { ToolContext, ToolResult, ToolCall } from "~/lib/ai/tools";
import type { CanvasIndex } from "~/lib/ai";
import { useBackgroundRemoval } from "./useBackgroundRemoval";

interface UseAgentToolsReturn {
  executeToolCall: (
    call: ToolCall,
    canvasIndex?: CanvasIndex,
  ) => Promise<ToolResult>;
  executeToolCalls: (
    calls: ToolCall[],
    canvasIndex?: CanvasIndex,
  ) => Promise<ToolResult[]>;
  parseToolCalls: (response: string) => ToolCall[];
  getAvailableTools: () => string[];
  isToolAvailable: (name: string) => boolean;
}

export function useAgentTools(
  editor: {
    canvas: fabric.Canvas;
    addText: (text: string, options?: Record<string, unknown>) => void;
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
  } | null,
): UseAgentToolsReturn {
  const { removeBackground } = useBackgroundRemoval();
  const registry = useMemo(() => getToolRegistry(), []);

  // build tool context from editor
  const buildContext = useCallback((): ToolContext => {
    if (!editor?.canvas) {
      return {
        canvas: null,
        editor: null,
      };
    }

    // get workspace bounds
    const workspace = editor.canvas
      .getObjects()
      .find(
        (obj) => (obj as unknown as { name?: string }).name === "workspace",
      );

    let workspaceBounds = { left: 0, top: 0, width: 800, height: 600 };
    if (workspace) {
      const vpt = editor.canvas.viewportTransform || [1, 0, 0, 1, 0, 0];
      const zoom = editor.canvas.getZoom();
      workspaceBounds = {
        left: (workspace.left || 0) * zoom + vpt[4],
        top: (workspace.top || 0) * zoom + vpt[5],
        width: (workspace.width || 800) * zoom,
        height: (workspace.height || 600) * zoom,
      };
    }

    // get selected element id
    const activeObj = editor.canvas.getActiveObject();
    const selectedElementId = activeObj
      ? (activeObj as unknown as { id?: string }).id
      : undefined;

    return {
      canvas: editor.canvas,
      editor: editor as ToolContext["editor"],
      workspaceBounds,
      selectedElementId,
    };
  }, [editor]);

  // execute a single tool call
  const executeToolCall = useCallback(
    async (call: ToolCall, canvasIndex?: CanvasIndex): Promise<ToolResult> => {
      const context = buildContext();

      if (!context.canvas || !context.editor) {
        return {
          success: false,
          message: "Editor not available",
        };
      }

      // special handling for remove_background - needs the hook function
      if (call.name === "remove_background") {
        const result = await registry.executeTool(
          call.name,
          { ...call.arguments, bgRemovalFn: removeBackground },
          context,
          canvasIndex,
        );
        return result;
      }

      return registry.executeTool(
        call.name,
        call.arguments,
        context,
        canvasIndex,
      );
    },
    [buildContext, registry, removeBackground],
  );

  // execute multiple tool calls
  const executeToolCalls = useCallback(
    async (
      calls: ToolCall[],
      canvasIndex?: CanvasIndex,
    ): Promise<ToolResult[]> => {
      const results: ToolResult[] = [];

      for (const call of calls) {
        const result = await executeToolCall(call, canvasIndex);
        results.push(result);

        // small delay between executions for canvas to update
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      return results;
    },
    [executeToolCall],
  );

  // parse tool calls from ai response
  const parseToolCalls = useCallback(
    (response: string): ToolCall[] => {
      return registry.parseToolCalls(response);
    },
    [registry],
  );

  // get list of available tools
  const getAvailableTools = useCallback((): string[] => {
    return registry.getAllTools().map((t) => t.name);
  }, [registry]);

  // check if a tool is available
  const isToolAvailable = useCallback(
    (name: string): boolean => {
      return registry.hasTool(name);
    },
    [registry],
  );

  return {
    executeToolCall,
    executeToolCalls,
    parseToolCalls,
    getAvailableTools,
    isToolAvailable,
  };
}
