// useCanvasEvents.ts - updated version
import { fabric } from "fabric";
import { useEffect, useRef } from "react";

interface CanvasEvents {
  canvas: fabric.Canvas | null;
  save: () => void;
  setSelectedObjects: React.Dispatch<
    React.SetStateAction<fabric.Object[] | null>
  >;
  clearSelection?: () => void;
  onModified?: () => void;
}

export const useCanvasEvents = ({
  canvas,
  save,
  setSelectedObjects,
  clearSelection,
  onModified,
}: CanvasEvents) => {
  // Use a ref to track the last modification time to prevent rapid triggers
  const lastModifiedRef = useRef<number>(0);

  useEffect(() => {
    if (canvas) {
      // Debounced modification handler to prevent excessive saves
      const handleModification = () => {
        const now = Date.now();
        // Only trigger if more than 300ms have passed since last trigger
        if (now - lastModifiedRef.current > 300) {
          lastModifiedRef.current = now;
          save();
          onModified?.();
        }
      };

      // Only attach event handlers for selection/object changes
      // These don't need to trigger saves immediately
      canvas.on("selection:created", (e) => {
        setSelectedObjects(e.selected || null);
      });

      canvas.on("selection:updated", (e) => {
        setSelectedObjects(e.selected || null);
      });

      canvas.on("selection:cleared", () => {
        setSelectedObjects(null);
        clearSelection?.();
      });

      // Only these specific events should trigger saves
      const objectModifiedHandler = () => {
        handleModification();
      };

      // Attach only to completed modification events
      canvas.on("object:added", objectModifiedHandler);
      canvas.on("object:removed", objectModifiedHandler);
      canvas.on("object:modified", objectModifiedHandler);
      canvas.on("path:created", objectModifiedHandler);
      canvas.on("text:changed", objectModifiedHandler);

      return () => {
        canvas.off("selection:created");
        canvas.off("selection:updated");
        canvas.off("selection:cleared");
        canvas.off("object:added");
        canvas.off("object:removed");
        canvas.off("object:modified");
        canvas.off("path:created");
        canvas.off("text:changed");
      };
    }
  }, [canvas, setSelectedObjects, clearSelection, save, onModified]);
};
