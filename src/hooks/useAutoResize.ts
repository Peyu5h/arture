"use client";

import { useCallback, useEffect } from "react";
import { fabric } from "fabric";

interface UseAutoResizeProps {
  canvas: fabric.Canvas | null;
  container: HTMLDivElement | null;
}

export const useAutoResize = ({ canvas, container }: UseAutoResizeProps) => {
  const autoZoom = useCallback(() => {
    if (!canvas || !container) return;

    const width = container.offsetWidth;
    const height = container.offsetHeight;

    canvas?.setWidth(width);
    canvas?.setHeight(height);

    const center = canvas?.getCenter();
    const zoomRatio = 0.85;

    const localWorkSpace = canvas
      ?.getObjects()
      .find((obj) => obj.name === "clip");

    // @ts-expect-error fabric.util type not fully defined
    const scale = fabric.util.findScaleToFit(localWorkSpace, {
      width: width,
      height: height,
    });

    const zoom = scale * zoomRatio;
    canvas.setViewportTransform(fabric.iMatrix.concat());
    canvas.zoomToPoint(new fabric.Point(center.left, center.top), zoom);

    if (!localWorkSpace) return;

    const workspaceCenter = localWorkSpace.getCenterPoint();
    const viewportTransform = canvas.viewportTransform;

    if (
      canvas.width == undefined ||
      canvas.height == undefined ||
      !viewportTransform
    )
      return;

    viewportTransform[4] =
      canvas.width / 2 - workspaceCenter.x * viewportTransform[0];
    viewportTransform[5] =
      canvas.height / 2 - workspaceCenter.y * viewportTransform[3];

    canvas.setViewportTransform(viewportTransform);

    localWorkSpace.clone((cloned: fabric.Rect) => {
      canvas.clipPath = cloned;
      canvas.requestRenderAll();
    });
  }, [canvas, container]);

  useEffect(() => {
    if (!canvas || !container) return;

    let resizeObserver: ResizeObserver | null = null;

    if (canvas && container) {
      resizeObserver = new ResizeObserver(() => {
        autoZoom();
      });

      resizeObserver.observe(container);
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [canvas, container, autoZoom]);

  return { autoZoom };
};
