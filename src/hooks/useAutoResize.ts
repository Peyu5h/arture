// useAutoResize.ts
import { useCallback, useEffect, useRef } from "react";
import { fabric } from "fabric";

interface UseAutoResizeProps {
  canvas: fabric.Canvas | null;
  container: HTMLDivElement | null;
}

export const useAutoResize = ({ canvas, container }: UseAutoResizeProps) => {
  // Track if initial zoom has been applied
  const initialZoomApplied = useRef(false);

  const autoZoom = useCallback(() => {
    if (!canvas || !container) return;

    const adjustCanvas = () => {
      try {
        // Set canvas dimensions to match container
        const width = container.offsetWidth;
        const height = container.offsetHeight;
        canvas.setWidth(width);
        canvas.setHeight(height);

        // Get the workspace
        const workspace = canvas
          .getObjects()
          .find((obj) => obj.name === "clip");
        if (!workspace) return;

        // Calculate zoom level to fit workspace
        // @ts-expect-error fabric.util type not fully defined
        const scale = fabric.util.findScaleToFit(workspace, {
          width: width * 0.85,
          height: height * 0.85,
        });

        // Apply zoom and center
        canvas.setViewportTransform(fabric.iMatrix.concat());
        const center = canvas.getCenter();
        canvas.zoomToPoint(new fabric.Point(center.left, center.top), scale);

        // Center the workspace
        const workspaceCenter = workspace.getCenterPoint();
        const viewportTransform = canvas.viewportTransform;
        if (!viewportTransform) return;

        viewportTransform[4] =
          width / 2 - workspaceCenter.x * viewportTransform[0];
        viewportTransform[5] =
          height / 2 - workspaceCenter.y * viewportTransform[3];

        canvas.setViewportTransform(viewportTransform);
        canvas.renderAll();

        // Update clipPath
        workspace.clone((cloned: fabric.Rect) => {
          canvas.clipPath = cloned;
          canvas.requestRenderAll();
        });
      } catch (error) {
        console.error("Error in autoZoom:", error);
      }
    };

    // Delay to ensure container dimensions are settled
    setTimeout(adjustCanvas, 100);
  }, [canvas, container]);

  // Set up resize observer
  useEffect(() => {
    if (!canvas || !container) return;

    // Only apply initial zoom once
    if (!initialZoomApplied.current) {
      autoZoom();
      initialZoomApplied.current = true;
    }

    let resizeObserver: ResizeObserver | null = null;
    resizeObserver = new ResizeObserver(() => {
      autoZoom();
    });
    resizeObserver.observe(container);

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [canvas, container, autoZoom]);

  return { autoZoom };
};
