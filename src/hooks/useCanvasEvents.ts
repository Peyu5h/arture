import { fabric } from "fabric";
import { useEffect } from "react";

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

      const handleModification = () => {
        save();
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
