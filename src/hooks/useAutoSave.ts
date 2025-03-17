import { useCallback, useEffect, useRef, useState } from "react";
import { Editor } from "~/lib/types";
import { useParams } from "next/navigation";
import { useUpdateProject } from "./useUpdateProject";
import { useToast } from "~/components/ui/use-toast";

const DEBOUNCE_TIME = 1000;

type CanvasStateValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: CanvasStateValue }
  | CanvasStateValue[];

interface CanvasState {
  version: string;
  objects: Array<{ [key: string]: CanvasStateValue }>;
  [key: string]: CanvasStateValue | Array<{ [key: string]: CanvasStateValue }>;
}

export type SaveState = "Idle" | "Saving" | "Saved" | "Save failed";

export const canvasState = editor.canvas.toJSON([
  "name",
  "selectable",
  "hasControls",
  "width",
  "height",
  "fill",
  "stroke",
  "strokeWidth",
  "strokeDashArray",
  "fontFamily",
  "fontSize",
  "fontWeight",
  "fontStyle",
  "textAlign",
  "underline",
  "linethrough",
  "opacity",
  "shadow",
  "clipPath",
  "visible",
  "backgroundColor",
  "radius",
  "startAngle",
  "endAngle",
  "type",
  "originX",
  "originY",
  "left",
  "top",
  "scaleX",
  "scaleY",
  "flipX",
  "flipY",
  "skewX",
  "skewY",
  "angle",
]);

export const useAutoSave = (editor: Editor | undefined) => {
  const { projectId } = useParams();
  const updateProject = useUpdateProject();
  const { toast } = useToast();
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const lastSaveRef = useRef<string>("");
  const savingRef = useRef(false);
  const [saveState, setSaveState] = useState<SaveState>("Idle");

  const handleAutoSave = useCallback(async () => {
    if (!editor?.canvas || !projectId || savingRef.current) return;

    try {
      savingRef.current = true;
      setSaveState("Saving");

      const rawState = editor.canvas.toJSON(canvasState);

      const canvasState = rawState as unknown as CanvasState;
      if (!canvasState.version || !Array.isArray(canvasState.objects)) {
        throw new Error("Invalid canvas state");
      }

      const currentState = JSON.stringify(canvasState);

      if (currentState === lastSaveRef.current) {
        savingRef.current = false;
        setSaveState("Saved");
        return;
      }

      lastSaveRef.current = currentState;
      const zoom = editor.canvas.getZoom();
      const viewportTransform = editor.canvas.viewportTransform;

      await updateProject.mutateAsync({
        id: projectId as string,
        data: {
          json: canvasState,
          width: editor.canvas.getWidth(),
          height: editor.canvas.getHeight(),
        },
      });

      if (viewportTransform) {
        editor.canvas.viewportTransform = viewportTransform;
      }
      editor.canvas.setZoom(zoom);

      setSaveState("Saved");
    } catch (error) {
      console.error("Error auto-saving project:", error);
      setSaveState("Save failed");
      toast({
        title: "Auto-save failed",
        description: "Failed to save your changes. Please try manually.",
        variant: "destructive",
      });
    } finally {
      savingRef.current = false;
    }
  }, [editor, projectId, updateProject, toast]);

  const debouncedSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    setSaveState("Idle");
    saveTimeoutRef.current = setTimeout(handleAutoSave, DEBOUNCE_TIME);
  }, [handleAutoSave]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return { debouncedSave, saveState, setSaveState };
};
