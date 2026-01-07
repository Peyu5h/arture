import { useCallback, useEffect, useState, useMemo } from "react";
import { fabric } from "fabric";
import { CanvasContext } from "~/components/editor/agent/types";
import {
  CanvasIndex,
  indexCanvas,
  generateContextSummary,
  getMinimalContext,
  resetImageRefs,
} from "~/lib/ai";

// safely serializes fill/stroke to string
function serializeFillOrStroke(value: unknown): string | undefined {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    if ("colorStops" in (value as object)) return "gradient";
    if ("source" in (value as object)) return "pattern";
    return "complex";
  }
  return String(value);
}

interface UseAgentContextReturn {
  context: CanvasContext | null;
  canvasIndex: CanvasIndex | null;
  isAnalyzing: boolean;
  analyzeCanvas: () => void;
  getCanvasJson: () => unknown | null;
  getSelectedObjectJson: () => unknown | null;
  getMinimalContextString: () => string;
  getSummary: () => string;
}

// extracts canvas context for ai agent
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useAgentContext = (editor: any): UseAgentContextReturn => {
  const [context, setContext] = useState<CanvasContext | null>(null);
  const [canvasIndex, setCanvasIndex] = useState<CanvasIndex | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeCanvas = useCallback(() => {
    if (!editor?.canvas) {
      setContext(null);
      setCanvasIndex(null);
      return;
    }

    setIsAnalyzing(true);

    try {
      const canvas = editor.canvas;

      // use new indexer
      const index = indexCanvas(canvas);
      setCanvasIndex(index);

      const objects = canvas
        .getObjects()
        .filter((obj: fabric.Object) => obj.name !== "clip");
      const activeObject = canvas.getActiveObject();
      const workspace = editor.getWorkspace();

      const hasText = objects.some(
        (obj: fabric.Object) =>
          obj.type === "textbox" ||
          obj.type === "text" ||
          obj.type === "i-text",
      );
      const hasImages = objects.some(
        (obj: fabric.Object) => obj.type === "image",
      );
      const hasShapes = objects.some(
        (obj: fabric.Object) =>
          obj.type === "rect" ||
          obj.type === "circle" ||
          obj.type === "triangle" ||
          obj.type === "polygon" ||
          obj.type === "path",
      );

      let selectedElement = null;
      if (activeObject && activeObject.name !== "clip") {
        selectedElement = {
          type: activeObject.type || "unknown",
          properties: {
            left: Math.round(activeObject.left || 0),
            top: Math.round(activeObject.top || 0),
            width: Math.round(
              (activeObject.width || 0) * (activeObject.scaleX || 1),
            ),
            height: Math.round(
              (activeObject.height || 0) * (activeObject.scaleY || 1),
            ),
            fill: serializeFillOrStroke(activeObject.fill),
            stroke: serializeFillOrStroke(activeObject.stroke),
            opacity: activeObject.opacity,
            angle: activeObject.angle ? Math.round(activeObject.angle) : 0,
            // @ts-ignore
            text: activeObject.text || undefined,
            // @ts-ignore
            fontFamily: activeObject.fontFamily || undefined,
            // @ts-ignore
            fontSize: activeObject.fontSize || undefined,
          },
        };
      }

      // safely extract background color
      let bgColor = "#ffffff";
      if (workspace?.fill) {
        if (typeof workspace.fill === "string") {
          bgColor = workspace.fill;
        } else if (typeof workspace.fill === "object") {
          bgColor = "gradient";
        }
      }

      const newContext: CanvasContext = {
        elementCount: objects.length,
        hasText,
        hasImages,
        hasShapes,
        selectedElement,
        canvasSize: {
          width: Math.round(workspace?.width || 500),
          height: Math.round(workspace?.height || 500),
        },
        backgroundColor: bgColor,
      };

      setContext(newContext);
    } catch (error) {
      console.error("Error analyzing canvas:", error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [editor]);

  useEffect(() => {
    if (!editor?.canvas) return;

    // reset image refs on new canvas
    resetImageRefs();
    analyzeCanvas();

    const canvas = editor.canvas;
    const events = [
      "object:added",
      "object:removed",
      "object:modified",
      "selection:created",
      "selection:updated",
      "selection:cleared",
    ];

    events.forEach((event) => {
      canvas.on(event, analyzeCanvas);
    });

    return () => {
      events.forEach((event) => {
        canvas.off(event, analyzeCanvas);
      });
    };
  }, [editor, analyzeCanvas]);

  const getCanvasJson = useCallback(() => {
    if (!editor?.canvas) return null;

    try {
      const json = editor.canvas.toJSON([
        "name",
        "selectable",
        "hasControls",
        "editable",
      ]);
      return json;
    } catch (error) {
      console.error("Error getting canvas JSON:", error);
      return null;
    }
  }, [editor]);

  const getSelectedObjectJson = useCallback(() => {
    if (!editor?.canvas) return null;

    const activeObject = editor.canvas.getActiveObject();
    if (!activeObject || activeObject.name === "clip") return null;

    try {
      return activeObject.toJSON([
        "name",
        "selectable",
        "hasControls",
        "editable",
      ]);
    } catch (error) {
      console.error("Error getting selected object JSON:", error);
      return null;
    }
  }, [editor]);

  const getMinimalContextString = useCallback(() => {
    if (!canvasIndex) return "{}";
    return getMinimalContext(canvasIndex);
  }, [canvasIndex]);

  const getSummary = useCallback(() => {
    if (!canvasIndex) return "Empty canvas";
    return canvasIndex.summary;
  }, [canvasIndex]);

  return {
    context,
    canvasIndex,
    isAnalyzing,
    analyzeCanvas,
    getCanvasJson,
    getSelectedObjectJson,
    getMinimalContextString,
    getSummary,
  };
};
