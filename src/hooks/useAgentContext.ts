import { useCallback, useEffect, useState } from "react";
import { fabric } from "fabric";
import { CanvasContext } from "~/components/editor/agent/types";

// safely serializes fill/stroke to string
function serializeFillOrStroke(value: unknown): string | undefined {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    // gradient or pattern
    if ("colorStops" in (value as object)) return "gradient";
    if ("source" in (value as object)) return "pattern";
    return "complex";
  }
  return String(value);
}

// extracts canvas context for ai agent
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useAgentContext = (editor: any) => {
  const [context, setContext] = useState<CanvasContext | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeCanvas = useCallback(() => {
    if (!editor?.canvas) {
      setContext(null);
      return;
    }

    setIsAnalyzing(true);

    try {
      const canvas = editor.canvas;
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
            left: activeObject.left,
            top: activeObject.top,
            width: activeObject.width,
            height: activeObject.height,
            fill: serializeFillOrStroke(activeObject.fill),
            stroke: serializeFillOrStroke(activeObject.stroke),
            opacity: activeObject.opacity,
            angle: activeObject.angle,
            scaleX: activeObject.scaleX,
            scaleY: activeObject.scaleY,
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
          width: workspace?.width || 500,
          height: workspace?.height || 500,
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

  return {
    context,
    isAnalyzing,
    analyzeCanvas,
    getCanvasJson,
    getSelectedObjectJson,
  };
};
