import { fabric } from "fabric";
import { useEffect } from "react";

interface CanvasEvents {
  canvas: fabric.Canvas | null;
  save: () => void;
  setSelectedObjects: React.Dispatch<
    React.SetStateAction<fabric.Object[] | null>
  >;
  clearSelection?: () => void;
}

export const useCanvasEvents = ({
  canvas,
  save,
  setSelectedObjects,
  clearSelection,
}: CanvasEvents) => {
  useEffect(() => {
    if (canvas) {
      canvas.on("selection:created", (e) => {
        setSelectedObjects(e.selected || null);
        save();
      });

      canvas.on("selection:updated", (e) => {
        setSelectedObjects(e.selected || null);
        save();
      });

      canvas.on("selection:cleared", () => {
        setSelectedObjects(null);
        clearSelection?.();
        save();
      });

      canvas.on("object:added", save);
      canvas.on("object:removed", save);
      canvas.on("object:modified", save); // Call save on modification
      canvas.on("object:scaling", save); // Call save on scaling
      canvas.on("object:moving", save); // Call save on moving
      canvas.on("object:updated", save);
    }

    return () => {
      if (canvas) {
        canvas.off("selection:created");
        canvas.off("selection:updated");
        canvas.off("selection:cleared");
        canvas.off("object:added");
        canvas.off("object:removed");
        canvas.off("object:modified");
        canvas.off("object:scaling");
        canvas.off("object:moving");
        canvas.off("object:updated");
      }
    };
  }, [canvas, setSelectedObjects, clearSelection, save]);
};
