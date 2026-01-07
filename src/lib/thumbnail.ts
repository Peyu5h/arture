import { fabric } from "fabric";

export interface ThumbnailOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: "png" | "jpeg" | "webp";
  backgroundColor?: string;
}

const DEFAULT_OPTIONS: ThumbnailOptions = {
  maxWidth: 400,
  maxHeight: 300,
  quality: 0.85,
  format: "jpeg",
  backgroundColor: "#ffffff",
};

// safely check if canvas is valid and ready
const isCanvasReady = (canvas: fabric.Canvas | null | undefined): boolean => {
  if (!canvas) return false;
  try {
    const ctx = canvas.getContext();
    return !!ctx;
  } catch {
    return false;
  }
};

// get workspace from canvas
const getWorkspace = (canvas: fabric.Canvas): fabric.Rect | null => {
  try {
    const workspace = canvas.getObjects().find((obj) => obj.name === "clip");
    return workspace as fabric.Rect | null;
  } catch {
    return null;
  }
};

// generates thumbnail from fabric canvas - captures only workspace content
export const generateThumbnail = async (
  canvas: fabric.Canvas | null | undefined,
  options: ThumbnailOptions = {},
): Promise<string | null> => {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  if (!isCanvasReady(canvas)) {
    console.warn("Canvas is not ready for thumbnail generation");
    return null;
  }

  const safeCanvas = canvas as fabric.Canvas;

  try {
    const workspace = getWorkspace(safeCanvas);

    if (!workspace) {
      console.warn("No workspace found for thumbnail generation");
      return null;
    }

    // get workspace bounds with scale applied
    const workspaceScaleX = workspace.scaleX || 1;
    const workspaceScaleY = workspace.scaleY || 1;
    const workspaceWidth = (workspace.width || 500) * workspaceScaleX;
    const workspaceHeight = (workspace.height || 500) * workspaceScaleY;
    const workspaceLeft = workspace.left || 0;
    const workspaceTop = workspace.top || 0;
    const workspaceFill = workspace.fill;

    // calculate thumbnail size preserving aspect ratio
    const scaleX = (opts.maxWidth || 400) / workspaceWidth;
    const scaleY = (opts.maxHeight || 300) / workspaceHeight;
    const scale = Math.min(scaleX, scaleY, 1);

    const thumbnailWidth = Math.round(workspaceWidth * scale);
    const thumbnailHeight = Math.round(workspaceHeight * scale);

    // save current canvas state
    const originalVpt = safeCanvas.viewportTransform
      ? [...safeCanvas.viewportTransform]
      : [1, 0, 0, 1, 0, 0];
    const originalZoom = safeCanvas.getZoom();
    const originalWidth = safeCanvas.getWidth();
    const originalHeight = safeCanvas.getHeight();

    // reset viewport to identity (no zoom, no pan)
    safeCanvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    safeCanvas.setZoom(1);

    // use fabric's toDataURL with explicit clipping to workspace area
    // this captures exactly what's in the workspace bounds
    let dataUrl: string;
    try {
      dataUrl = safeCanvas.toDataURL({
        format: opts.format === "jpeg" ? "jpeg" : "png",
        quality: opts.quality,
        left: workspaceLeft,
        top: workspaceTop,
        width: workspaceWidth,
        height: workspaceHeight,
        multiplier: scale,
      });
    } catch (exportError) {
      console.warn("Canvas toDataURL failed:", exportError);
      // restore viewport
      safeCanvas.setViewportTransform(
        originalVpt as [number, number, number, number, number, number],
      );
      safeCanvas.setZoom(originalZoom);
      return null;
    }

    // restore original viewport state
    safeCanvas.setViewportTransform(
      originalVpt as [number, number, number, number, number, number],
    );
    safeCanvas.setZoom(originalZoom);

    // if export succeeded and starts with data:image, we're done
    if (dataUrl && dataUrl.startsWith("data:image")) {
      return dataUrl;
    }

    // fallback: create canvas manually and render
    return new Promise((resolve) => {
      const offscreenCanvas = document.createElement("canvas");
      offscreenCanvas.width = thumbnailWidth;
      offscreenCanvas.height = thumbnailHeight;

      const ctx = offscreenCanvas.getContext("2d");
      if (!ctx) {
        resolve(null);
        return;
      }

      // fill background
      const bgColor =
        typeof workspaceFill === "string"
          ? workspaceFill
          : opts.backgroundColor || "#ffffff";
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, thumbnailWidth, thumbnailHeight);

      resolve(offscreenCanvas.toDataURL(`image/${opts.format}`, opts.quality));
    });
  } catch (error) {
    console.error("Error generating thumbnail:", error);
    return null;
  }
};

// alternative implementation using manual rendering
export const generateThumbnailManual = async (
  canvas: fabric.Canvas | null | undefined,
  options: ThumbnailOptions = {},
): Promise<string | null> => {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  if (!isCanvasReady(canvas)) {
    return null;
  }

  const safeCanvas = canvas as fabric.Canvas;

  try {
    const workspace = getWorkspace(safeCanvas);
    if (!workspace) {
      return null;
    }

    const workspaceScaleX = workspace.scaleX || 1;
    const workspaceScaleY = workspace.scaleY || 1;
    const workspaceWidth = (workspace.width || 500) * workspaceScaleX;
    const workspaceHeight = (workspace.height || 500) * workspaceScaleY;
    const workspaceLeft = workspace.left || 0;
    const workspaceTop = workspace.top || 0;
    const workspaceFill = workspace.fill;

    const scaleX = (opts.maxWidth || 400) / workspaceWidth;
    const scaleY = (opts.maxHeight || 300) / workspaceHeight;
    const scale = Math.min(scaleX, scaleY, 1);

    const thumbnailWidth = Math.round(workspaceWidth * scale);
    const thumbnailHeight = Math.round(workspaceHeight * scale);

    // create a temporary fabric canvas for rendering
    const tempCanvasEl = document.createElement("canvas");
    tempCanvasEl.width = thumbnailWidth;
    tempCanvasEl.height = thumbnailHeight;

    const ctx = tempCanvasEl.getContext("2d");
    if (!ctx) {
      return null;
    }

    // fill background
    const bgColor =
      typeof workspaceFill === "string"
        ? workspaceFill
        : opts.backgroundColor || "#ffffff";
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, thumbnailWidth, thumbnailHeight);

    // set up transformation to map workspace to thumbnail
    ctx.scale(scale, scale);
    ctx.translate(-workspaceLeft, -workspaceTop);

    // get all objects except workspace clip
    const objects = safeCanvas
      .getObjects()
      .filter((obj) => obj.name !== "clip" && obj.visible !== false);

    // render each object manually
    for (const obj of objects) {
      try {
        obj.render(ctx);
      } catch (renderError) {
        // skip objects that fail to render
        console.warn("Object render failed:", renderError);
      }
    }

    return tempCanvasEl.toDataURL(`image/${opts.format}`, opts.quality);
  } catch (error) {
    console.error("Error generating manual thumbnail:", error);
    return null;
  }
};

// robust thumbnail generation with multiple fallback strategies
export const generateThumbnailRobust = async (
  canvas: fabric.Canvas | null | undefined,
  options: ThumbnailOptions = {},
): Promise<string | null> => {
  // try primary method first
  const result = await generateThumbnail(canvas, options);
  if (result && result.startsWith("data:image")) {
    return result;
  }

  // fallback to manual rendering
  const manualResult = await generateThumbnailManual(canvas, options);
  if (manualResult && manualResult.startsWith("data:image")) {
    return manualResult;
  }

  return null;
};

// converts data url to blob
export const dataUrlToBlob = (dataUrl: string): Blob | null => {
  try {
    if (!dataUrl || !dataUrl.includes(",")) return null;

    const arr = dataUrl.split(",");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) return null;

    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    return new Blob([u8arr], { type: mime });
  } catch (error) {
    console.error("Error converting data URL to blob:", error);
    return null;
  }
};

// compresses image if needed
export const compressDataUrl = async (
  dataUrl: string,
  maxSizeKB: number = 100,
): Promise<string> => {
  if (!dataUrl) return dataUrl;

  const blob = dataUrlToBlob(dataUrl);
  if (!blob) return dataUrl;

  const sizeKB = blob.size / 1024;
  if (sizeKB <= maxSizeKB) return dataUrl;

  return new Promise((resolve) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      let quality = 0.7;
      let result = dataUrl;

      while (quality > 0.1) {
        result = canvas.toDataURL("image/jpeg", quality);
        const compressedBlob = dataUrlToBlob(result);
        if (compressedBlob && compressedBlob.size / 1024 <= maxSizeKB) {
          break;
        }
        quality -= 0.1;
      }

      resolve(result);
    };

    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
};

// generates a quick low-quality preview
export const generateQuickPreview = (
  canvas: fabric.Canvas | null | undefined,
): string | null => {
  if (!isCanvasReady(canvas)) return null;

  const safeCanvas = canvas as fabric.Canvas;

  try {
    const workspace = getWorkspace(safeCanvas);
    if (!workspace) return null;

    const workspaceScaleX = workspace.scaleX || 1;
    const workspaceScaleY = workspace.scaleY || 1;
    const workspaceWidth = (workspace.width || 500) * workspaceScaleX;
    const workspaceHeight = (workspace.height || 500) * workspaceScaleY;

    // save and reset viewport
    const originalVpt = safeCanvas.viewportTransform
      ? [...safeCanvas.viewportTransform]
      : [1, 0, 0, 1, 0, 0];
    const originalZoom = safeCanvas.getZoom();

    safeCanvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    safeCanvas.setZoom(1);

    const result = safeCanvas.toDataURL({
      format: "jpeg",
      quality: 0.4,
      left: workspace.left || 0,
      top: workspace.top || 0,
      width: workspaceWidth,
      height: workspaceHeight,
      multiplier: 0.15,
    });

    // restore viewport
    safeCanvas.setViewportTransform(
      originalVpt as [number, number, number, number, number, number],
    );
    safeCanvas.setZoom(originalZoom);

    return result;
  } catch (error) {
    console.error("Error generating quick preview:", error);
    return null;
  }
};
