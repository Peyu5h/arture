import { useCallback, useEffect } from "react";
import { fabric } from "fabric";

interface UseAdvancedZoomProps {
  canvas: fabric.Canvas | null;
  container: HTMLDivElement | null;
}

export const useAdvancedZoom = ({
  canvas,
  container,
}: UseAdvancedZoomProps) => {
  // No animation frame ref needed

  const getWorkspaceBounds = useCallback(() => {
    if (!canvas) return null;

    const workspace = canvas
      .getObjects()
      .find((object) => object.name === "clip");
    if (!workspace) return null;

    return workspace.getBoundingRect();
  }, [canvas]);

  const getWorkspaceCenter = useCallback((): fabric.Point => {
    if (!canvas) return new fabric.Point(0, 0);

    const workspaceBounds = getWorkspaceBounds();
    if (!workspaceBounds) {
      return new fabric.Point(canvas.getVpCenter().x, canvas.getVpCenter().y);
    }

    return new fabric.Point(
      workspaceBounds.left + workspaceBounds.width / 2,
      workspaceBounds.top + workspaceBounds.height / 2,
    );
  }, [canvas, getWorkspaceBounds]);

  const isWorkspaceVisible = useCallback(() => {
    if (!canvas || !container) return true;

    const workspaceBounds = getWorkspaceBounds();
    if (!workspaceBounds) return true;

    const vpt = canvas.viewportTransform;
    if (!vpt) return true;

    const zoom = canvas.getZoom();
    const containerRect = container.getBoundingClientRect();

    const workspaceViewportBounds = {
      left: workspaceBounds.left * zoom + vpt[4],
      top: workspaceBounds.top * zoom + vpt[5],
      width: workspaceBounds.width * zoom,
      height: workspaceBounds.height * zoom,
    };

    const overlapsHorizontally =
      workspaceViewportBounds.left < containerRect.width &&
      workspaceViewportBounds.left + workspaceViewportBounds.width > 0;

    const overlapsVertically =
      workspaceViewportBounds.top < containerRect.height &&
      workspaceViewportBounds.top + workspaceViewportBounds.height > 0;

    return overlapsHorizontally && overlapsVertically;
  }, [canvas, container, getWorkspaceBounds]);

  // Simple function to ensure canvas dimensions are appropriate
  const updateCanvasDimensions = useCallback(() => {
    if (!canvas || !container) return;
    
    // Set canvas to container size for simplicity
    const containerRect = container.getBoundingClientRect();
    canvas.setDimensions({
      width: containerRect.width,
      height: containerRect.height,
    });
  }, [canvas, container]);

  // Simplified: No need for complex adjustment logic

  const smoothZoomTo = useCallback(
    (targetZoom: number, center: fabric.Point, duration: number = 300) => {
      if (!canvas) return;

      // Clamp zoom between 30% and 120%
      const clampedZoom = Math.max(0.3, Math.min(1.2, targetZoom));
      
      // Get the current zoom
      const startZoom = canvas.getZoom();
      const startTime = Date.now();
      
      // Create animation function
      const animate = () => {
        const currentTime = Date.now();
        const elapsedTime = currentTime - startTime;
        
        if (elapsedTime >= duration) {
          // Animation complete, set final zoom
          canvas.zoomToPoint(center, clampedZoom);
          canvas.requestRenderAll();
          return;
        }
        
        // Calculate progress (0 to 1) with easing
        const progress = elapsedTime / duration;
        const easedProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease out for smooth deceleration
        
        // Interpolate between start and target zoom
        const currentZoom = startZoom + (clampedZoom - startZoom) * easedProgress;
        
        // Apply the current zoom
        canvas.zoomToPoint(center, currentZoom);
        canvas.requestRenderAll();
        
        // Continue animation
        requestAnimationFrame(animate);
      };
      
      // Start animation
      animate();
    },
    [canvas],
  );

  const handleScroll = useCallback(
    (event: Event) => {
      if (!canvas || !container) return;

      const target = event.target as HTMLElement;
      if (target !== container) return;

      const scrollLeft = target.scrollLeft;
      const scrollTop = target.scrollTop;

      const vpt = canvas.viewportTransform;
      if (vpt) {
        const currentZoom = canvas.getZoom();
        const currentPanX = Math.abs(vpt[4]) / currentZoom;
        const currentPanY = Math.abs(vpt[5]) / currentZoom;

        if (
          Math.abs(scrollLeft - currentPanX) > 1 ||
          Math.abs(scrollTop - currentPanY) > 1
        ) {
          const panX = scrollLeft / currentZoom;
          const panY = scrollTop / currentZoom;

          vpt[4] = -panX * currentZoom;
          vpt[5] = -panY * currentZoom;

          canvas.setViewportTransform(vpt);
          canvas.requestRenderAll();
        }
      }
    },
    [canvas, container],
  );

  useEffect(() => {
    if (!container) return;

    const containerElement = container;

    containerElement.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      containerElement.removeEventListener("scroll", handleScroll);
    };
  }, [container, handleScroll]);

  const zoomIn = useCallback(() => {
    if (!canvas) return;

    const currentZoom = canvas.getZoom();
    // Use 1.2 (120%) as the maximum zoom limit
    if (currentZoom >= 1.2) {
      return;
    }

    // Increase by 10% each time, up to max 120%
    const newZoom = Math.min(1.2, currentZoom * 1.1);
    const center = getWorkspaceCenter();
    smoothZoomTo(newZoom, center, 300);
  }, [canvas, smoothZoomTo, getWorkspaceCenter]);

  const zoomOut = useCallback(() => {
    if (!canvas) return;

    const currentZoom = canvas.getZoom();
    // Minimum zoom is 30%
    if (currentZoom <= 0.3) {
      return;
    }

    // Decrease by 10% each time
    const newZoom = Math.max(0.3, currentZoom * 0.9);
    const center = getWorkspaceCenter();
    smoothZoomTo(newZoom, center, 300);
  }, [canvas, smoothZoomTo, getWorkspaceCenter]);

  const resetZoom = useCallback(() => {
    if (!canvas) return;
    
    // Always reset to zoom level 1 (100%)
    const center = getWorkspaceCenter();
    smoothZoomTo(1, center, 400);
  }, [canvas, smoothZoomTo, getWorkspaceCenter]);

  const centerWorkspace = useCallback(() => {
    if (!canvas || !container) return;

    const workspaceCenter = getWorkspaceCenter();
    const containerRect = container.getBoundingClientRect();
    const currentZoom = canvas.getZoom();
    
    // Simple centering calculation
    const containerCenter = new fabric.Point(
      containerRect.width / 2,
      containerRect.height / 2,
    );

    const newVpt = [...(canvas.viewportTransform || [1, 0, 0, 1, 0, 0])];
    newVpt[4] = containerCenter.x - workspaceCenter.x * currentZoom;
    newVpt[5] = containerCenter.y - workspaceCenter.y * currentZoom;

    canvas.setViewportTransform(newVpt as number[]);
    canvas.requestRenderAll();
  }, [canvas, container, getWorkspaceCenter]);

  const fitToScreen = useCallback(() => {
    if (!canvas || !container) return;

    const workspaceBounds = getWorkspaceBounds();
    if (!workspaceBounds) return;

    const containerRect = container.getBoundingClientRect();

    // Calculate scale to fit workspace with 10% padding
    const scaleX = (containerRect.width * 0.9) / workspaceBounds.width;
    const scaleY = (containerRect.height * 0.9) / workspaceBounds.height;
    
    // Use the smaller of the two scales, but respect min/max zoom limits
    const scale = Math.max(0.3, Math.min(scaleX, scaleY, 1.2));
    
    const center = getWorkspaceCenter();
    smoothZoomTo(scale, center, 400);
  }, [canvas, container, smoothZoomTo, getWorkspaceBounds, getWorkspaceCenter]);

  return {
    zoomIn,
    zoomOut,
    resetZoom,
    fitToScreen,
    centerWorkspace,
    getCurrentZoom: () => canvas?.getZoom() || 1,
    isWorkspaceVisible,
  };
};
