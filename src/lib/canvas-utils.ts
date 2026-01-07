import { fabric } from "fabric";

// safely render canvas with error handling
export function safeRenderAll(canvas: fabric.Canvas | null): boolean {
  if (!canvas) return false;

  try {
    const ctx = canvas.getContext();
    if (!ctx) return false;

    canvas.renderAll();
    return true;
  } catch (error) {
    // canvas context not ready or disposed
    console.warn("Canvas render skipped:", error);
    return false;
  }
}

// safely request render with error handling
export function safeRequestRenderAll(canvas: fabric.Canvas | null): boolean {
  if (!canvas) return false;

  try {
    const ctx = canvas.getContext();
    if (!ctx) return false;

    canvas.requestRenderAll();
    return true;
  } catch (error) {
    console.warn("Canvas request render skipped:", error);
    return false;
  }
}

// check if canvas is ready for rendering
export function isCanvasReady(canvas: fabric.Canvas | null): boolean {
  if (!canvas) return false;

  try {
    const ctx = canvas.getContext();
    return !!ctx;
  } catch {
    return false;
  }
}

// delay render until canvas is ready
export function renderWhenReady(
  canvas: fabric.Canvas | null,
  maxRetries: number = 5,
  delay: number = 50,
): Promise<boolean> {
  return new Promise((resolve) => {
    let retries = 0;

    const tryRender = () => {
      if (safeRenderAll(canvas)) {
        resolve(true);
        return;
      }

      retries++;
      if (retries < maxRetries) {
        setTimeout(tryRender, delay);
      } else {
        resolve(false);
      }
    };

    tryRender();
  });
}

// get workspace from canvas
export function getWorkspace(canvas: fabric.Canvas | null): fabric.Rect | null {
  if (!canvas) return null;

  const workspace = canvas
    .getObjects()
    .find((obj) => obj.name === "clip") as fabric.Rect;

  return workspace || null;
}

// center object on workspace
export function centerOnWorkspace(
  canvas: fabric.Canvas,
  object: fabric.Object,
): void {
  const workspace = getWorkspace(canvas);
  if (!workspace) {
    canvas.centerObject(object);
    return;
  }

  const workspaceCenter = workspace.getCenterPoint();
  object.set({
    left: workspaceCenter.x,
    top: workspaceCenter.y,
    originX: "center",
    originY: "center",
  });
  object.setCoords();
}

// calculate position on workspace based on keyword
export function calculatePositionOnWorkspace(
  canvas: fabric.Canvas,
  position:
    | "center"
    | "top-left"
    | "top-center"
    | "top-right"
    | "middle-left"
    | "middle-right"
    | "bottom-left"
    | "bottom-center"
    | "bottom-right",
  padding: number = 50,
): { left: number; top: number } {
  const workspace = getWorkspace(canvas);

  if (!workspace) {
    return { left: 0, top: 0 };
  }

  const workspaceLeft = workspace.left || 0;
  const workspaceTop = workspace.top || 0;
  const workspaceWidth = (workspace.width || 900) * (workspace.scaleX || 1);
  const workspaceHeight = (workspace.height || 1200) * (workspace.scaleY || 1);

  const positions: Record<string, { left: number; top: number }> = {
    center: {
      left: workspaceLeft + workspaceWidth / 2,
      top: workspaceTop + workspaceHeight / 2,
    },
    "top-left": {
      left: workspaceLeft + padding,
      top: workspaceTop + padding,
    },
    "top-center": {
      left: workspaceLeft + workspaceWidth / 2,
      top: workspaceTop + padding,
    },
    "top-right": {
      left: workspaceLeft + workspaceWidth - padding,
      top: workspaceTop + padding,
    },
    "middle-left": {
      left: workspaceLeft + padding,
      top: workspaceTop + workspaceHeight / 2,
    },
    "middle-right": {
      left: workspaceLeft + workspaceWidth - padding,
      top: workspaceTop + workspaceHeight / 2,
    },
    "bottom-left": {
      left: workspaceLeft + padding,
      top: workspaceTop + workspaceHeight - padding,
    },
    "bottom-center": {
      left: workspaceLeft + workspaceWidth / 2,
      top: workspaceTop + workspaceHeight - padding,
    },
    "bottom-right": {
      left: workspaceLeft + workspaceWidth - padding,
      top: workspaceTop + workspaceHeight - padding,
    },
  };

  return positions[position] || positions.center;
}
