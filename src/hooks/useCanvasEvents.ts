import { fabric } from "fabric";
import { useEffect } from "react";

interface CanvasEvents {
  canvas: fabric.Canvas | null;
  setSelectedObjects: React.Dispatch<
    React.SetStateAction<fabric.Object[] | null>
  >;
  clearSelection?: () => void;
}

export const useCanvasEvents = ({
  canvas,
  setSelectedObjects,
  clearSelection,
}: CanvasEvents) => {
  useEffect(() => {
    if (canvas) {
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
    }

    return () => {
      if (canvas) {
        canvas.off("selection:created");
        canvas.off("selection:updated");
        canvas.off("selection:cleared");
      }
    };
  }, [canvas, setSelectedObjects, clearSelection]);
};
