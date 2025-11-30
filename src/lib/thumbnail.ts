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
  quality: 0.8,
  format: "jpeg",
  backgroundColor: "#ffffff",
};

// generates thumbnail from fabric canvas
export const generateThumbnail = async (
  canvas: fabric.Canvas,
  options: ThumbnailOptions = {},
): Promise<string | null> => {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    const workspace = canvas
      .getObjects()
      .find((obj) => obj.name === "clip") as fabric.Rect | undefined;

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
    const scale = Math.min(scaleX, scaleY);

    const thumbnailWidth = Math.round(workspaceWidth * scale);
    const thumbnailHeight = Math.round(workspaceHeight * scale);

    // create offscreen canvas for thumbnail
    const offscreenCanvas = document.createElement("canvas");
    offscreenCanvas.width = thumbnailWidth;
    offscreenCanvas.height = thumbnailHeight;

    const ctx = offscreenCanvas.getContext("2d");
    if (!ctx) {
      console.error("Failed to get canvas context");
      return null;
    }

    // fill background
    ctx.fillStyle = opts.backgroundColor || "#ffffff";
    ctx.fillRect(0, 0, thumbnailWidth, thumbnailHeight);

    // get the canvas data url at full resolution for the workspace area
    const dataUrl = canvas.toDataURL({
      format: opts.format === "jpeg" ? "jpeg" : "png",
      quality: 1,
      left: workspaceLeft,
      top: workspaceTop,
      width: workspaceWidth,
      height: workspaceHeight,
    });

    // load and draw scaled image
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, thumbnailWidth, thumbnailHeight);

        const thumbnailDataUrl = offscreenCanvas.toDataURL(
          `image/${opts.format}`,
          opts.quality,
        );
        resolve(thumbnailDataUrl);
      };
      img.onerror = () => {
        console.error("Failed to load canvas image for thumbnail");
        resolve(null);
      };
      img.src = dataUrl;
    });
  } catch (error) {
    console.error("Error generating thumbnail:", error);
    return null;
  }
};

// converts data url to blob for upload
export const dataUrlToBlob = (dataUrl: string): Blob | null => {
  try {
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
  const blob = dataUrlToBlob(dataUrl);
  if (!blob) return dataUrl;

  const sizeKB = blob.size / 1024;
  if (sizeKB <= maxSizeKB) return dataUrl;

  // reduce quality iteratively
  let quality = 0.7;
  let compressedDataUrl = dataUrl;

  const img = new Image();
  await new Promise<void>((resolve) => {
    img.onload = () => resolve();
    img.src = dataUrl;
  });

  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;

  ctx.drawImage(img, 0, 0);

  while (quality > 0.1) {
    compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
    const compressedBlob = dataUrlToBlob(compressedDataUrl);
    if (compressedBlob && compressedBlob.size / 1024 <= maxSizeKB) {
      break;
    }
    quality -= 0.1;
  }

  return compressedDataUrl;
};

// generates a quick low-quality preview
export const generateQuickPreview = (
  canvas: fabric.Canvas,
): string | null => {
  try {
    const workspace = canvas
      .getObjects()
      .find((obj) => obj.name === "clip") as fabric.Rect | undefined;

    if (!workspace) return null;

    return canvas.toDataURL({
      format: "jpeg",
      quality: 0.5,
      left: workspace.left || 0,
      top: workspace.top || 0,
      width: workspace.width || 500,
      height: workspace.height || 500,
      multiplier: 0.2,
    });
  } catch (error) {
    console.error("Error generating quick preview:", error);
    return null;
  }
};
