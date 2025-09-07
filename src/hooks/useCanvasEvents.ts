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
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isZoomingRef = useRef(false);

  const debouncedSave = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      if (!isZoomingRef.current) {
        save();
      }
    }, 100); // Debounce saves by 100ms
  };

  useEffect(() => {
    if (canvas) {
      // Track zoom state
      const originalZoomToPoint = canvas.zoomToPoint;
      canvas.zoomToPoint = function (point: fabric.Point, zoom: number) {
        isZoomingRef.current = true;
        originalZoomToPoint.call(this, point, zoom);
        setTimeout(() => {
          isZoomingRef.current = false;
        }, 50);
      };

      canvas.on("selection:created", (e) => {
        setSelectedObjects(e.selected || null);
        debouncedSave();
      });

      canvas.on("selection:updated", (e) => {
        setSelectedObjects(e.selected || null);
        debouncedSave();
      });

      canvas.on("selection:cleared", () => {
        setSelectedObjects(null);
        clearSelection?.();
        debouncedSave();
      });

      const handleModification = () => {
        debouncedSave();
        onModified?.();
      };

      canvas.on("object:added", handleModification);
      canvas.on("object:removed", handleModification);
      canvas.on("object:modified", handleModification);
      canvas.on("object:scaling", handleModification);
      canvas.on("object:moving", handleModification);
      canvas.on("object:rotating", handleModification);
      canvas.on("object:updated", handleModification);
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (canvas) {
        canvas.off("selection:created");
        canvas.off("selection:updated");
        canvas.off("selection:cleared");
        canvas.off("object:added");
        canvas.off("object:removed");
        canvas.off("object:modified");
        canvas.off("object:scaling");
        canvas.off("object:moving");
        canvas.off("object:rotating");
        canvas.off("object:updated");
      }
    };
  }, [canvas, setSelectedObjects, clearSelection, save, onModified]);
};
