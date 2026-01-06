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
  const canvasRef = useRef<fabric.Canvas | null>(null);

  useEffect(() => {
    canvasRef.current = canvas;
  }, [canvas]);

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

    // safe render helper
    const safeRenderAll = () => {
      if (canvasRef.current) {
        try {
          canvasRef.current.requestRenderAll();
        } catch (e) {
          // canvas may be disposed
        }
      }
    };

    // selection handlers
    const onSelectionCreated = (e: fabric.IEvent) => {
      setSelectedObjects((e as any).selected || null);
      safeRenderAll();
    };

    const onSelectionUpdated = (e: fabric.IEvent) => {
      setSelectedObjects((e as any).selected || null);
      safeRenderAll();
    };

    const onSelectionCleared = () => {
      setSelectedObjects(null);
      clearSelection?.();
      safeRenderAll();
    };

    // content change handlers
    const onObjectAdded = () => {
      if (isZoomingRef.current) return;
      save();
      onModified?.();
    };

    const onObjectRemoved = () => {
      if (isZoomingRef.current) return;
      safeRenderAll();
      save();
      onModified?.();
    };

    const onObjectModified = () => {
      if (isZoomingRef.current) return;
      if (canvasRef.current) {
        try {
          const active = canvasRef.current.getActiveObject();
          if (active) active.setCoords();
          safeRenderAll();
        } catch (e) {
          // canvas may be disposed
        }
      }
      save();
      onModified?.();
    };

    const onMouseUp = () => {
      safeRenderAll();
    };

    canvas.on("selection:created", onSelectionCreated);
    canvas.on("selection:updated", onSelectionUpdated);
    canvas.on("selection:cleared", onSelectionCleared);
    canvas.on("object:added", onObjectAdded);
    canvas.on("object:removed", onObjectRemoved);
    canvas.on("object:modified", onObjectModified);
    canvas.on("mouse:up", onMouseUp);

    return () => {
      canvas.off("selection:created", onSelectionCreated);
      canvas.off("selection:updated", onSelectionUpdated);
      canvas.off("selection:cleared", onSelectionCleared);
      canvas.off("object:added", onObjectAdded);
      canvas.off("object:removed", onObjectRemoved);
      canvas.off("object:modified", onObjectModified);
      canvas.off("mouse:up", onMouseUp);
    };
  }, [canvas, setSelectedObjects, clearSelection, save, onModified]);
};
