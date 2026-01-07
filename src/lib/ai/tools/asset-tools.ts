// asset tools for image search and manipulation

import { ToolContext, ToolResult, AssetSearchResult } from "./types";
import { CanvasIndex } from "../types";
import { fabric } from "fabric";

// search images from pexels/pixabay
export async function executeSearchImages(
  params: Record<string, unknown>,
  context: ToolContext,
): Promise<ToolResult> {
  const query = params.query as string;
  if (!query) {
    return { success: false, message: "Search query is required" };
  }

  const count = Math.min((params.count as number) || 5, 10);

  try {
    const results: AssetSearchResult[] = [];

    // try pexels first
    try {
      const res = await fetch(
        `/api/pexels/search?q=${encodeURIComponent(query)}&per_page=${count}`,
      );
      if (res.ok) {
        const data = await res.json();
        if (data?.success && data?.data?.images?.length) {
          results.push(
            ...data.data.images.map((img: Record<string, unknown>) => ({
              id: String(img.id),
              url: (img.url as string) || (img.thumbnail as string),
              thumbnail: img.thumbnail as string,
              preview: img.preview as string,
              width: img.width as number,
              height: img.height as number,
              source: "pexels" as const,
              author: img.photographer as string,
            })),
          );
        }
      }
    } catch {}

    // fallback to pixabay
    if (results.length === 0) {
      try {
        const res = await fetch(
          `/api/pixabay/search?q=${encodeURIComponent(query)}&per_page=${count}`,
        );
        if (res.ok) {
          const data = await res.json();
          if (data?.success && data?.data?.images?.length) {
            results.push(
              ...data.data.images.map((img: Record<string, unknown>) => ({
                id: String(img.id),
                url: (img.url as string) || (img.thumbnail as string),
                thumbnail: img.thumbnail as string,
                preview: img.preview as string,
                width: img.width as number,
                height: img.height as number,
                source: "pixabay" as const,
                author: img.user as string,
              })),
            );
          }
        }
      } catch {}
    }

    if (results.length === 0) {
      return {
        success: false,
        message: `No images found for "${query}"`,
      };
    }

    return {
      success: true,
      message: `Found ${results.length} images for "${query}"`,
      data: { images: results.slice(0, count) },
    };
  } catch (error) {
    return {
      success: false,
      message: `Search failed: ${error instanceof Error ? error.message : "Unknown"}`,
    };
  }
}

// search illustrations
export async function executeSearchIllustrations(
  params: Record<string, unknown>,
  context: ToolContext,
): Promise<ToolResult> {
  const query = params.query as string;
  if (!query) {
    return { success: false, message: "Search query is required" };
  }

  const count = Math.min((params.count as number) || 5, 10);

  try {
    const res = await fetch(
      `/api/pixabay/illustrations?q=${encodeURIComponent(query)}&per_page=${count}`,
    );

    if (!res.ok) {
      return { success: false, message: "Failed to search illustrations" };
    }

    const data = await res.json();
    if (!data?.success || !data?.data?.images?.length) {
      return {
        success: false,
        message: `No illustrations found for "${query}"`,
      };
    }

    const images = data.data.images.map((img: Record<string, unknown>) => ({
      id: String(img.id),
      url: (img.url as string) || (img.thumbnail as string),
      thumbnail: img.thumbnail as string,
      preview: img.preview as string,
      width: img.width as number,
      height: img.height as number,
      source: "pixabay" as const,
      author: img.user as string,
    }));

    return {
      success: true,
      message: `Found ${images.length} illustrations`,
      data: { images },
    };
  } catch (error) {
    return {
      success: false,
      message: `Search failed: ${error instanceof Error ? error.message : "Unknown"}`,
    };
  }
}

// get workspace bounds
function getWorkspaceBounds(canvas: fabric.Canvas | null): {
  left: number;
  top: number;
  width: number;
  height: number;
} {
  if (!canvas) return { left: 0, top: 0, width: 800, height: 600 };

  const workspace = canvas
    .getObjects()
    .find((obj) => (obj as unknown as { name?: string }).name === "clip");

  if (workspace) {
    return {
      left: workspace.left || 0,
      top: workspace.top || 0,
      width: workspace.width || 800,
      height: workspace.height || 600,
    };
  }

  return { left: 0, top: 0, width: 800, height: 600 };
}

type PositionPreset =
  | "center"
  | "top-left"
  | "top-center"
  | "top-right"
  | "middle-left"
  | "middle-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

// resolve position preset to coords
function resolvePositionToCoords(
  bounds: { left: number; top: number; width: number; height: number },
  position: PositionPreset,
  objWidth: number,
  objHeight: number,
): { x: number; y: number } {
  const margin = 20;

  const positions: Record<PositionPreset, { x: number; y: number }> = {
    center: {
      x: bounds.left + bounds.width / 2 - objWidth / 2,
      y: bounds.top + bounds.height / 2 - objHeight / 2,
    },
    "top-left": { x: bounds.left + margin, y: bounds.top + margin },
    "top-center": {
      x: bounds.left + bounds.width / 2 - objWidth / 2,
      y: bounds.top + margin,
    },
    "top-right": {
      x: bounds.left + bounds.width - objWidth - margin,
      y: bounds.top + margin,
    },
    "middle-left": {
      x: bounds.left + margin,
      y: bounds.top + bounds.height / 2 - objHeight / 2,
    },
    "middle-right": {
      x: bounds.left + bounds.width - objWidth - margin,
      y: bounds.top + bounds.height / 2 - objHeight / 2,
    },
    "bottom-left": {
      x: bounds.left + margin,
      y: bounds.top + bounds.height - objHeight - margin,
    },
    "bottom-center": {
      x: bounds.left + bounds.width / 2 - objWidth / 2,
      y: bounds.top + bounds.height - objHeight - margin,
    },
    "bottom-right": {
      x: bounds.left + bounds.width - objWidth - margin,
      y: bounds.top + bounds.height - objHeight - margin,
    },
  };

  return positions[position] || positions.center;
}

// add image to canvas
export async function executeAddImageToCanvas(
  params: Record<string, unknown>,
  context: ToolContext,
): Promise<ToolResult> {
  const { canvas, editor } = context;
  if (!canvas) {
    return { success: false, message: "Canvas not available" };
  }

  const url = params.url as string;
  if (!url) {
    return { success: false, message: "Image URL is required" };
  }

  const position = (params.position as PositionPreset) || "center";
  const targetWidth = params.width as number | undefined;
  const targetHeight = params.height as number | undefined;

  try {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = () => {
        const bounds = getWorkspaceBounds(canvas);
        const imgWidth = img.width;
        const imgHeight = img.height;

        let scale = Math.min(
          (bounds.width * 0.5) / imgWidth,
          (bounds.height * 0.5) / imgHeight,
          1,
        );

        if (targetWidth) scale = targetWidth / imgWidth;
        else if (targetHeight) scale = targetHeight / imgHeight;

        const scaledWidth = imgWidth * scale;
        const scaledHeight = imgHeight * scale;
        const coords = resolvePositionToCoords(
          bounds,
          position,
          scaledWidth,
          scaledHeight,
        );

        const fabricImg = new fabric.Image(img, {
          left: coords.x,
          top: coords.y,
          scaleX: scale,
          scaleY: scale,
        });

        canvas.add(fabricImg);
        canvas.setActiveObject(fabricImg);
        canvas.requestRenderAll();
        editor?.save?.();

        resolve({
          success: true,
          message: "Added image to canvas",
        });
      };

      img.onerror = () => {
        resolve({
          success: false,
          message: "Failed to load image",
        });
      };

      img.src = url;
    });
  } catch (error) {
    return {
      success: false,
      message: `Error: ${error instanceof Error ? error.message : "Unknown"}`,
    };
  }
}

// find element by id or query
function findElement(
  canvas: fabric.Canvas | null,
  elementId?: string,
  elementQuery?: string,
  canvasIndex?: CanvasIndex,
): fabric.Object | null {
  if (!canvas) return null;

  const objects = canvas
    .getObjects()
    .filter((obj) => (obj as unknown as { name?: string }).name !== "clip");

  // find by id
  if (elementId) {
    const byId = objects.find(
      (obj) => (obj as unknown as { id?: string }).id === elementId,
    );
    if (byId) return byId;
  }

  // handle selected
  if (elementQuery?.toLowerCase() === "selected") {
    return canvas.getActiveObject();
  }

  // find by query
  if (elementQuery) {
    const query = elementQuery.toLowerCase();

    // match by type
    const imageMatch = objects.find((obj) => {
      if (obj.type === "image") {
        return query.includes("image") || query.includes("photo");
      }
      return false;
    });
    if (imageMatch) return imageMatch;
  }

  return null;
}

// remove background from image
export async function executeRemoveBackground(
  params: Record<string, unknown>,
  context: ToolContext,
  canvasIndex?: CanvasIndex,
  bgRemovalFn?: (imageSource: string | Blob | File) => Promise<Blob | null>,
): Promise<ToolResult> {
  const { canvas, editor } = context;
  if (!canvas) {
    return { success: false, message: "Canvas not available" };
  }

  const elementId = params.elementId as string | undefined;
  const elementQuery = (params.elementQuery as string) || "selected";

  const element = findElement(canvas, elementId, elementQuery, canvasIndex);
  if (!element) {
    return {
      success: false,
      message: "No image element found. Select an image first.",
    };
  }

  if (element.type !== "image") {
    return {
      success: false,
      message: "Selected element is not an image.",
    };
  }

  const imageElement = element as fabric.Image & { getSrc?: () => string };
  const imageSrc =
    imageElement.getSrc?.() ||
    (imageElement as unknown as { src?: string }).src ||
    (imageElement as unknown as { _element?: HTMLImageElement })._element?.src;

  if (!imageSrc) {
    return { success: false, message: "Could not get image source" };
  }

  if (!bgRemovalFn) {
    return {
      success: false,
      message:
        "Background removal requires the UI action. Use the BG Remove button in the toolbar.",
      data: {
        requiresUIAction: true,
        elementId: (element as unknown as { id?: string }).id,
        action: "remove_background",
      },
    };
  }

  try {
    const resultBlob = await bgRemovalFn(imageSrc);
    if (!resultBlob) {
      return { success: false, message: "Background removal failed" };
    }

    // convert blob to data url
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(resultBlob);
    });

    // replace image
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = () => {
        const origProps = {
          left: imageElement.left,
          top: imageElement.top,
          scaleX: imageElement.scaleX,
          scaleY: imageElement.scaleY,
          angle: imageElement.angle,
        };

        const newImage = new fabric.Image(img);
        newImage.set(origProps);

        canvas.remove(imageElement);
        canvas.add(newImage);
        canvas.setActiveObject(newImage);
        canvas.requestRenderAll();
        editor?.save?.();

        resolve({
          success: true,
          message: "Background removed successfully",
        });
      };

      img.onerror = () => {
        resolve({
          success: false,
          message: "Failed to load processed image",
        });
      };

      img.src = dataUrl;
    });
  } catch (error) {
    return {
      success: false,
      message: `Error: ${error instanceof Error ? error.message : "Unknown"}`,
    };
  }
}

// export tool executors
export const assetToolExecutors: Record<
  string,
  (
    params: Record<string, unknown>,
    context: ToolContext,
    canvasIndex?: CanvasIndex,
    bgRemovalFn?: (imageSource: string | Blob | File) => Promise<Blob | null>,
  ) => Promise<ToolResult>
> = {
  search_images: executeSearchImages,
  search_illustrations: executeSearchIllustrations,
  add_image_to_canvas: executeAddImageToCanvas,
  remove_background: executeRemoveBackground,
};
