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

// generates thumbnail from fabric canvas
export const generateThumbnail = async (
  canvas: fabric.Canvas | null | undefined,
  options: ThumbnailOptions = {},
): Promise<string | null> => {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // validate canvas
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

    const workspaceWidth = workspace.width || 500;
    const workspaceHeight = workspace.height || 500;
    const workspaceLeft = workspace.left || 0;
    const workspaceTop = workspace.top || 0;

    // calculate scale to fit within max dimensions
    const scaleX = (opts.maxWidth || 400) / workspaceWidth;
    const scaleY = (opts.maxHeight || 300) / workspaceHeight;
    const scale = Math.min(scaleX, scaleY, 1);

    const thumbnailWidth = Math.round(workspaceWidth * scale);
    const thumbnailHeight = Math.round(workspaceHeight * scale);

    // create offscreen canvas
    const offscreenCanvas = document.createElement("canvas");
    offscreenCanvas.width = thumbnailWidth;
    offscreenCanvas.height = thumbnailHeight;

    const ctx = offscreenCanvas.getContext("2d");
    if (!ctx) {
      console.error("Failed to get offscreen canvas context");
      return null;
    }

    // fill background
    const workspaceFill = workspace.fill;
    ctx.fillStyle =
      typeof workspaceFill === "string"
        ? workspaceFill
        : opts.backgroundColor || "#ffffff";
    ctx.fillRect(0, 0, thumbnailWidth, thumbnailHeight);

    // check if there are objects to render
    const objects = safeCanvas
      .getObjects()
      .filter((obj) => obj.name !== "clip" && obj.visible !== false);

    if (objects.length === 0) {
      // no objects, return empty workspace thumbnail
      return offscreenCanvas.toDataURL(`image/${opts.format}`, opts.quality);
    }

    // export canvas to data url
    let dataUrl: string;
    try {
      dataUrl = safeCanvas.toDataURL({
        format: opts.format === "jpeg" ? "jpeg" : "png",
        quality: 1,
        left: workspaceLeft,
        top: workspaceTop,
        width: workspaceWidth,
        height: workspaceHeight,
      });
    } catch (exportError) {
      console.warn(
        "Canvas export failed, returning background only:",
        exportError,
      );
      return offscreenCanvas.toDataURL(`image/${opts.format}`, opts.quality);
    }

    // validate data url
    if (!dataUrl || !dataUrl.startsWith("data:image")) {
      console.warn("Invalid data URL from canvas export");
      return offscreenCanvas.toDataURL(`image/${opts.format}`, opts.quality);
    }

    // load and draw scaled image
    return new Promise((resolve) => {
      const img = new Image();

      const timeoutId = setTimeout(() => {
        console.warn("Thumbnail image load timeout");
        resolve(
          offscreenCanvas.toDataURL(`image/${opts.format}`, opts.quality),
        );
      }, 5000);

      img.onload = () => {
        clearTimeout(timeoutId);

        // redraw background
        ctx.fillStyle =
          typeof workspaceFill === "string"
            ? workspaceFill
            : opts.backgroundColor || "#ffffff";
        ctx.fillRect(0, 0, thumbnailWidth, thumbnailHeight);

        // draw scaled content
        ctx.drawImage(img, 0, 0, thumbnailWidth, thumbnailHeight);

        const result = offscreenCanvas.toDataURL(
          `image/${opts.format}`,
          opts.quality,
        );
        resolve(result);
      };

      img.onerror = () => {
        clearTimeout(timeoutId);
        console.warn("Failed to load canvas export image");
        resolve(
          offscreenCanvas.toDataURL(`image/${opts.format}`, opts.quality),
        );
      };

      img.src = dataUrl;
    });
  } catch (error) {
    console.error("Error generating thumbnail:", error);
    return null;
  }
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

    return safeCanvas.toDataURL({
      format: "jpeg",
      quality: 0.4,
      left: workspace.left || 0,
      top: workspace.top || 0,
      width: workspace.width || 500,
      height: workspace.height || 500,
      multiplier: 0.15,
    });
  } catch (error) {
    console.error("Error generating quick preview:", error);
    return null;
  }
};
