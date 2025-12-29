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
  const isZoomingRef = useRef(false);

  useEffect(() => {
    if (!canvas) return;

    // track zoom state
    const originalZoomToPoint = canvas.zoomToPoint.bind(canvas);
    canvas.zoomToPoint = function (point: fabric.Point, zoom: number) {
      isZoomingRef.current = true;
      const result = originalZoomToPoint(point, zoom);
      setTimeout(() => {
        isZoomingRef.current = false;
      }, 50);
      return result;
    } as typeof canvas.zoomToPoint;

    // selection handlers - call renderAll for immediate visual feedback
    const onSelectionCreated = (e: fabric.IEvent) => {
      setSelectedObjects((e as any).selected || null);
      canvas.renderAll();
    };

    const onSelectionUpdated = (e: fabric.IEvent) => {
      setSelectedObjects((e as any).selected || null);
      canvas.renderAll();
    };

    const onSelectionCleared = () => {
      setSelectedObjects(null);
      clearSelection?.();
      canvas.renderAll();
    };

    // content change handlers
    const onObjectAdded = () => {
      if (isZoomingRef.current) return;
      save();
      onModified?.();
    };

    const onObjectRemoved = () => {
      if (isZoomingRef.current) return;
      canvas.renderAll();
      save();
      onModified?.();
    };

    const onObjectModified = () => {
      if (isZoomingRef.current) return;
      const active = canvas.getActiveObject();
      if (active) active.setCoords();
      canvas.renderAll();
      save();
      onModified?.();
    };

    canvas.on("selection:created", onSelectionCreated);
    canvas.on("selection:updated", onSelectionUpdated);
    canvas.on("selection:cleared", onSelectionCleared);
    canvas.on("object:added", onObjectAdded);
    canvas.on("object:removed", onObjectRemoved);
    canvas.on("object:modified", onObjectModified);
    
    // clear drag selection rectangle after mouse up
    canvas.on("mouse:up", () => {
      canvas.renderAll();
    });

    return () => {
      canvas.off("selection:created", onSelectionCreated);
      canvas.off("selection:updated", onSelectionUpdated);
      canvas.off("selection:cleared", onSelectionCleared);
      canvas.off("object:added", onObjectAdded);
      canvas.off("object:removed", onObjectRemoved);
      canvas.off("object:modified", onObjectModified);
      canvas.off("mouse:up");
    };
  }, [canvas, setSelectedObjects, clearSelection, save, onModified]);
};
