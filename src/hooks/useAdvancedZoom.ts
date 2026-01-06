import { useCallback, useEffect, useRef } from "react";
import { fabric } from "fabric";

interface UseAdvancedZoomProps {
  canvas: fabric.Canvas | null;
  container: HTMLDivElement | null;
  minZoom?: number;
  maxZoom?: number;
  margin?: number;
}

// smooth zoom and pan for fabric canvas - canva-style behavior
export const useAdvancedZoom = ({
  canvas,
  container,
  minZoom: minZoomProp = 0.1,
  maxZoom = 5,
  margin = 90,
}: UseAdvancedZoomProps) => {
  const animationFrameRef = useRef<number | null>(null);
  const isPanningRef = useRef(false);
  const lastPanPositionRef = useRef({ x: 0, y: 0 });
  const isSpacebarDownRef = useRef(false);
  const lastPinchDistanceRef = useRef<number | null>(null);
  const targetZoomRef = useRef(1);
  const isAnimatingRef = useRef(false);
  const lastRenderTimeRef = useRef(0);
  const renderThrottleMs = 16; // ~60fps

  // calculate minimum zoom to keep canvas centered with margin
  const getMinZoom = useCallback(() => {
    if (!canvas || !container) return minZoomProp;

    const workspace = canvas.getObjects().find((obj) => obj.name === "clip");
    if (!workspace) return minZoomProp;

    const containerRect = container.getBoundingClientRect();
    const availableHeight = containerRect.height - margin * 2;
    const availableWidth = containerRect.width - margin * 2;

    const workspaceWidth = workspace.width || 500;
    const workspaceHeight = workspace.height || 500;

    // calculate zoom that fits workspace with margin
    const fitZoomX = availableWidth / workspaceWidth;
    const fitZoomY = availableHeight / workspaceHeight;
    const fitZoom = Math.min(fitZoomX, fitZoomY);

    // minimum zoom should not go below this
    return Math.max(minZoomProp, fitZoom);
  }, [canvas, container, margin, minZoomProp]);

  // clamp zoom value within bounds
  const clampZoom = useCallback(
    (zoom: number) => {
      const minZoom = getMinZoom();
      return Math.max(minZoom, Math.min(maxZoom, zoom));
    },
    [getMinZoom, maxZoom],
  );

  // get workspace bounds
  const getWorkspaceBounds = useCallback(() => {
    if (!canvas) return null;
    const workspace = canvas.getObjects().find((obj) => obj.name === "clip");
    if (!workspace) return null;
    return workspace.getBoundingRect();
  }, [canvas]);

  // get workspace center point
  const getWorkspaceCenter = useCallback((): fabric.Point => {
    if (!canvas) return new fabric.Point(0, 0);

    const workspace = canvas.getObjects().find((obj) => obj.name === "clip");
    if (!workspace) {
      return new fabric.Point(canvas.getWidth() / 2, canvas.getHeight() / 2);
    }

    const center = workspace.getCenterPoint();
    return new fabric.Point(center.x, center.y);
  }, [canvas]);

  // check if workspace is visible in viewport
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

  // throttled render to prevent excessive repaints
  const throttledRender = useCallback(() => {
    if (!canvas) return;
    const now = performance.now();
    if (now - lastRenderTimeRef.current >= renderThrottleMs) {
      lastRenderTimeRef.current = now;
      canvas.requestRenderAll();
    }
  }, [canvas]);

  // center the workspace in the viewport
  const centerWorkspaceImmediate = useCallback(
    (skipRender = false) => {
      if (!canvas || !container) return;

      const workspaceCenter = getWorkspaceCenter();
      const containerRect = container.getBoundingClientRect();
      const currentZoom = canvas.getZoom();

      const containerCenterX = containerRect.width / 2;
      const containerCenterY = containerRect.height / 2;

      const vpt = canvas.viewportTransform || [1, 0, 0, 1, 0, 0];
      vpt[4] = containerCenterX - workspaceCenter.x * currentZoom;
      vpt[5] = containerCenterY - workspaceCenter.y * currentZoom;

      canvas.setViewportTransform(vpt);
      if (!skipRender) {
        throttledRender();
      }
    },
    [canvas, container, getWorkspaceCenter, throttledRender],
  );

  // smooth zoom to point with animation, then center
  const smoothZoomToPoint = useCallback(
    (targetZoom: number, focalPoint: fabric.Point, animate: boolean = true) => {
      if (!canvas || !container) return;

      const clampedZoom = clampZoom(targetZoom);
      const currentZoom = canvas.getZoom();

      if (Math.abs(clampedZoom - currentZoom) < 0.001) return;

      if (!animate) {
        canvas.zoomToPoint(focalPoint, clampedZoom);
        centerWorkspaceImmediate();
        return;
      }

      targetZoomRef.current = clampedZoom;
      isAnimatingRef.current = true;

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      const animateZoom = () => {
        if (!canvas) {
          isAnimatingRef.current = false;
          return;
        }

        const current = canvas.getZoom();
        const target = targetZoomRef.current;
        const diff = Math.abs(target - current);

        if (diff < 0.001) {
          canvas.zoomToPoint(focalPoint, target);
          centerWorkspaceImmediate();
          animationFrameRef.current = null;
          isAnimatingRef.current = false;
          return;
        }

        // faster interpolation for snappier feel
        const newZoom = current + (target - current) * 0.25;
        canvas.zoomToPoint(focalPoint, newZoom);
        centerWorkspaceImmediate(true); // skip render during animation
        throttledRender();

        animationFrameRef.current = requestAnimationFrame(animateZoom);
      };

      animationFrameRef.current = requestAnimationFrame(animateZoom);
    },
    [canvas, container, clampZoom, centerWorkspaceImmediate, throttledRender],
  );

  // constrain pan to keep workspace visible
  const constrainPan = useCallback(() => {
    if (!canvas || !container) return;

    const workspace = canvas.getObjects().find((obj) => obj.name === "clip");
    if (!workspace) return;

    const containerRect = container.getBoundingClientRect();
    const zoom = canvas.getZoom();
    const vpt = canvas.viewportTransform;
    if (!vpt) return;

    const workspaceCenter = workspace.getCenterPoint();
    const workspaceWidth = (workspace.width || 500) * zoom;
    const workspaceHeight = (workspace.height || 500) * zoom;

    // calculate bounds for panning
    const minPanX =
      containerRect.width / 2 -
      workspaceCenter.x * zoom -
      workspaceWidth / 2 +
      margin;
    const maxPanX =
      containerRect.width / 2 -
      workspaceCenter.x * zoom +
      workspaceWidth / 2 -
      margin;
    const minPanY =
      containerRect.height / 2 -
      workspaceCenter.y * zoom -
      workspaceHeight / 2 +
      margin;
    const maxPanY =
      containerRect.height / 2 -
      workspaceCenter.y * zoom +
      workspaceHeight / 2 -
      margin;

    // if workspace is smaller than container, center it
    if (workspaceWidth <= containerRect.width - margin * 2) {
      vpt[4] = containerRect.width / 2 - workspaceCenter.x * zoom;
    } else {
      vpt[4] = Math.max(minPanX, Math.min(maxPanX, vpt[4]));
    }

    if (workspaceHeight <= containerRect.height - margin * 2) {
      vpt[5] = containerRect.height / 2 - workspaceCenter.y * zoom;
    } else {
      vpt[5] = Math.max(minPanY, Math.min(maxPanY, vpt[5]));
    }

    canvas.setViewportTransform(vpt);
  }, [canvas, container, margin]);

  // handle wheel events - scroll to pan, pinch to zoom
  const handleWheel = useCallback(
    (event: WheelEvent) => {
      if (!canvas || !container) return;

      event.preventDefault();
      event.stopPropagation();

      // pinch gesture detected via ctrlKey - ZOOM
      const isPinchGesture = event.ctrlKey;

      if (isPinchGesture) {
        // pinch to zoom - use direct zoom without animation for responsiveness
        const containerRect = container.getBoundingClientRect();
        const centerX = containerRect.width / 2;
        const centerY = containerRect.height / 2;
        const focalPoint = new fabric.Point(centerX, centerY);

        const currentZoom = canvas.getZoom();
        const sensitivity = 0.008; // slightly reduced for smoother feel
        const zoomDelta = -event.deltaY * sensitivity;
        const zoomFactor = Math.exp(zoomDelta);
        const newZoom = clampZoom(currentZoom * zoomFactor);

        canvas.zoomToPoint(focalPoint, newZoom);
        centerWorkspaceImmediate(true);
        throttledRender();
        return;
      }

      // regular scroll - PAN the view
      const vpt = canvas.viewportTransform;
      if (!vpt) return;

      // pan based on scroll delta with throttled render
      vpt[4] -= event.deltaX;
      vpt[5] -= event.deltaY;

      canvas.setViewportTransform(vpt);
      constrainPan();
      throttledRender();
    },
    [canvas, container, clampZoom, centerWorkspaceImmediate, constrainPan],
  );

  // mouse down for panning
  const handleMouseDown = useCallback(
    (event: MouseEvent) => {
      if (!container) return;

      const isMiddleButton = event.button === 1;
      const isSpacePan = isSpacebarDownRef.current && event.button === 0;

      if (isMiddleButton || isSpacePan) {
        event.preventDefault();
        isPanningRef.current = true;
        lastPanPositionRef.current = { x: event.clientX, y: event.clientY };
        container.style.cursor = "grabbing";
      }
    },
    [container],
  );

  // mouse move for panning
  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!canvas || !isPanningRef.current) return;

      const vpt = canvas.viewportTransform;
      if (!vpt) return;

      const deltaX = event.clientX - lastPanPositionRef.current.x;
      const deltaY = event.clientY - lastPanPositionRef.current.y;

      vpt[4] += deltaX;
      vpt[5] += deltaY;

      canvas.setViewportTransform(vpt);
      constrainPan();
      throttledRender();

      lastPanPositionRef.current = { x: event.clientX, y: event.clientY };
    },
    [canvas, constrainPan, throttledRender],
  );

  // mouse up to stop panning
  const handleMouseUp = useCallback(() => {
    if (!container) return;
    if (isPanningRef.current) {
      isPanningRef.current = false;
      container.style.cursor = isSpacebarDownRef.current ? "grab" : "default";
    }
  }, [container]);

  // keydown for spacebar pan mode
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!container) return;
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      )
        return;

      if (event.code === "Space" && !isSpacebarDownRef.current) {
        event.preventDefault();
        isSpacebarDownRef.current = true;
        container.style.cursor = "grab";
      }
    },
    [container],
  );

  // keyup to exit spacebar pan mode
  const handleKeyUp = useCallback(
    (event: KeyboardEvent) => {
      if (!container) return;
      if (event.code === "Space") {
        isSpacebarDownRef.current = false;
        if (!isPanningRef.current) {
          container.style.cursor = "default";
        }
      }
    },
    [container],
  );

  // touch events for mobile pinch zoom and pan
  const handleTouchStart = useCallback(
    (event: TouchEvent) => {
      if (event.touches.length === 2) {
        event.preventDefault();
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        lastPinchDistanceRef.current = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY,
        );
        isPanningRef.current = false;
      } else if (event.touches.length === 1) {
        // single finger pan
        const touch = event.touches[0];
        isPanningRef.current = true;
        lastPanPositionRef.current = { x: touch.clientX, y: touch.clientY };
        if (container) {
          container.style.cursor = "grabbing";
        }
      }
    },
    [container],
  );

  const handleTouchMove = useCallback(
    (event: TouchEvent) => {
      if (!canvas || !container) return;

      if (event.touches.length === 2 && lastPinchDistanceRef.current !== null) {
        event.preventDefault();

        const touch1 = event.touches[0];
        const touch2 = event.touches[1];

        const containerRect = container.getBoundingClientRect();
        const focalPoint = new fabric.Point(
          containerRect.width / 2,
          containerRect.height / 2,
        );

        const currentDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY,
        );

        const scale = currentDistance / lastPinchDistanceRef.current;
        const currentZoom = canvas.getZoom();
        const newZoom = clampZoom(currentZoom * scale);

        canvas.zoomToPoint(focalPoint, newZoom);
        centerWorkspaceImmediate();
        lastPinchDistanceRef.current = currentDistance;
      } else if (event.touches.length === 1) {
        // single finger pan
        const touch = event.touches[0];
        if (isPanningRef.current) {
          const vpt = canvas.viewportTransform;
          if (!vpt) return;

          const deltaX = touch.clientX - lastPanPositionRef.current.x;
          const deltaY = touch.clientY - lastPanPositionRef.current.y;

          vpt[4] += deltaX;
          vpt[5] += deltaY;

          canvas.setViewportTransform(vpt);
          constrainPan();

          lastPanPositionRef.current = { x: touch.clientX, y: touch.clientY };
        }
      }
    },
    [canvas, container, clampZoom, centerWorkspaceImmediate, constrainPan],
  );

  const handleTouchEnd = useCallback(() => {
    lastPinchDistanceRef.current = null;
    isPanningRef.current = false;
    if (container) {
      container.style.cursor = "default";
    }
  }, [container]);

  // prevent browser gestures
  const preventGesture = useCallback((event: Event) => {
    event.preventDefault();
  }, []);

  // setup event listeners
  useEffect(() => {
    if (!container || !canvas) return;

    container.addEventListener("wheel", handleWheel, { passive: false });
    container.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    container.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    container.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    container.addEventListener("touchend", handleTouchEnd);
    container.addEventListener("gesturestart", preventGesture);
    container.addEventListener("gesturechange", preventGesture);

    const handleContextMenu = (e: MouseEvent) => {
      if (e.button === 1) e.preventDefault();
    };
    container.addEventListener("contextmenu", handleContextMenu);

    // center workspace on init
    setTimeout(() => {
      centerWorkspaceImmediate();
    }, 100);

    return () => {
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
      container.removeEventListener("gesturestart", preventGesture);
      container.removeEventListener("gesturechange", preventGesture);
      container.removeEventListener("contextmenu", handleContextMenu);

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [
    canvas,
    container,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleKeyDown,
    handleKeyUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    preventGesture,
    centerWorkspaceImmediate,
  ]);

  // programmatic zoom in
  const zoomIn = useCallback(() => {
    if (!canvas || !container) return;

    const currentZoom = canvas.getZoom();
    if (currentZoom >= maxZoom) return;

    const containerRect = container.getBoundingClientRect();
    const center = new fabric.Point(
      containerRect.width / 2,
      containerRect.height / 2,
    );

    smoothZoomToPoint(currentZoom * 1.2, center, true);
  }, [canvas, container, maxZoom, smoothZoomToPoint]);

  // programmatic zoom out
  const zoomOut = useCallback(() => {
    if (!canvas || !container) return;

    const currentZoom = canvas.getZoom();
    const minZoom = getMinZoom();
    if (currentZoom <= minZoom) return;

    const containerRect = container.getBoundingClientRect();
    const center = new fabric.Point(
      containerRect.width / 2,
      containerRect.height / 2,
    );

    smoothZoomToPoint(currentZoom / 1.2, center, true);
  }, [canvas, container, getMinZoom, smoothZoomToPoint]);

  // reset to 100% zoom
  const resetZoom = useCallback(() => {
    if (!canvas || !container) return;

    const containerRect = container.getBoundingClientRect();
    const center = new fabric.Point(
      containerRect.width / 2,
      containerRect.height / 2,
    );

    smoothZoomToPoint(1, center, true);
  }, [canvas, container, smoothZoomToPoint]);

  // center workspace in view with animation
  const centerWorkspace = useCallback(() => {
    if (!canvas || !container) return;

    const workspaceCenter = getWorkspaceCenter();
    const containerRect = container.getBoundingClientRect();
    const currentZoom = canvas.getZoom();

    const containerCenterX = containerRect.width / 2;
    const containerCenterY = containerRect.height / 2;

    const targetVptX = containerCenterX - workspaceCenter.x * currentZoom;
    const targetVptY = containerCenterY - workspaceCenter.y * currentZoom;

    const vpt = canvas.viewportTransform;
    if (!vpt) return;

    const startX = vpt[4];
    const startY = vpt[5];
    let progress = 0;

    const animatePan = () => {
      progress += 0.08;
      if (progress >= 1) {
        vpt[4] = targetVptX;
        vpt[5] = targetVptY;
        canvas.setViewportTransform(vpt);
        canvas.requestRenderAll();
        return;
      }

      const eased = 1 - Math.pow(1 - progress, 3);
      vpt[4] = startX + (targetVptX - startX) * eased;
      vpt[5] = startY + (targetVptY - startY) * eased;
      canvas.setViewportTransform(vpt);
      canvas.requestRenderAll();

      requestAnimationFrame(animatePan);
    };

    requestAnimationFrame(animatePan);
  }, [canvas, container, getWorkspaceCenter]);

  // fit workspace to screen with margin
  const fitToScreen = useCallback(() => {
    if (!canvas || !container) return;

    const workspace = canvas.getObjects().find((obj) => obj.name === "clip");
    if (!workspace) return;

    const containerRect = container.getBoundingClientRect();
    const availableWidth = containerRect.width - margin * 2;
    const availableHeight = containerRect.height - margin * 2;

    const workspaceWidth = workspace.width || 500;
    const workspaceHeight = workspace.height || 500;

    const scaleX = availableWidth / workspaceWidth;
    const scaleY = availableHeight / workspaceHeight;
    const scale = Math.min(scaleX, scaleY, maxZoom);

    const center = new fabric.Point(
      containerRect.width / 2,
      containerRect.height / 2,
    );

    smoothZoomToPoint(scale, center, true);
  }, [canvas, container, margin, maxZoom, smoothZoomToPoint]);

  const minZoom = getMinZoom();

  return {
    zoomIn,
    zoomOut,
    resetZoom,
    fitToScreen,
    centerWorkspace,
    getCurrentZoom: () => canvas?.getZoom() || 1,
    isWorkspaceVisible,
    minZoom,
    maxZoom,
  };
};
