// asset tools for image search and manipulation

import { ToolContext, ToolResult, AssetSearchResult } from "./types";
import { CanvasIndex } from "../types";
import { fabric } from "fabric";

const API_BASE = "/api";

// search images from pixabay and pexels
export async function executeSearchImages(
  params: Record<string, unknown>,
  context: ToolContext,
): Promise<ToolResult> {
  const query = params.query as string;
  if (!query) {
    return { success: false, message: "Search query is required" };
  }

  const source = (params.source as string) || "all";
  const imageType = (params.imageType as string) || "all";
  const count = Math.min((params.count as number) || 5, 10);

  try {
    const results: AssetSearchResult[] = [];

    // search pixabay
    if (source === "all" || source === "pixabay") {
      try {
        const pixabayRes = await fetch(
          `${API_BASE}/pixabay/search?q=${encodeURIComponent(query)}&image_type=${imageType}&per_page=${count}`,
        );
        if (pixabayRes.ok) {
          const pixabayData = await pixabayRes.json();
          if (pixabayData.success && pixabayData.data?.images) {
            results.push(
              ...pixabayData.data.images.map(
                (img: Record<string, unknown>) => ({
                  id: img.id as string,
                  url: img.url as string,
                  thumbnail: img.thumbnail as string,
                  preview: img.preview as string,
                  width: img.width as number,
                  height: img.height as number,
                  source: "pixabay" as const,
                  tags: img.tags as string[],
                  author: img.user as string,
                }),
              ),
            );
          }
        }
      } catch (err) {
        console.error("Pixabay search error:", err);
      }
    }

    // search pexels
    if (source === "all" || source === "pexels") {
      try {
        const pexelsRes = await fetch(
          `${API_BASE}/pexels/search?q=${encodeURIComponent(query)}&per_page=${count}`,
        );
        if (pexelsRes.ok) {
          const pexelsData = await pexelsRes.json();
          if (pexelsData.success && pexelsData.data?.images) {
            results.push(
              ...pexelsData.data.images.map((img: Record<string, unknown>) => ({
                id: img.id as string,
                url: img.url as string,
                thumbnail: img.thumbnail as string,
                preview: img.preview as string,
                width: img.width as number,
                height: img.height as number,
                source: "pexels" as const,
                author: img.photographer as string,
                alt: img.alt as string,
              })),
            );
          }
        }
      } catch (err) {
        console.error("Pexels search error:", err);
      }
    }

    if (results.length === 0) {
      return {
        success: false,
        message: `No images found for "${query}"`,
        data: { images: [] },
      };
    }

    // limit to requested count
    const limitedResults = results.slice(0, count);

    return {
      success: true,
      message: `Found ${limitedResults.length} images for "${query}"`,
      data: {
        images: limitedResults,
        query,
        totalFound: results.length,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: `Error searching images: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

// search illustrations from pixabay
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
    const response = await fetch(
      `${API_BASE}/pixabay/illustrations?q=${encodeURIComponent(query)}&per_page=${count}`,
    );

    if (!response.ok) {
      return { success: false, message: "Failed to search illustrations" };
    }

    const data = await response.json();

    if (!data.success || !data.data?.images?.length) {
      return {
        success: false,
        message: `No illustrations found for "${query}"`,
        data: { images: [] },
      };
    }

    const images = data.data.images
      .slice(0, count)
      .map((img: Record<string, unknown>) => ({
        id: img.id as string,
        url: img.url as string,
        thumbnail: img.thumbnail as string,
        preview: img.preview as string,
        width: img.width as number,
        height: img.height as number,
        source: "pixabay" as const,
        tags: img.tags as string[],
        author: img.user as string,
      }));

    return {
      success: true,
      message: `Found ${images.length} illustrations for "${query}"`,
      data: { images, query },
    };
  } catch (error) {
    return {
      success: false,
      message: `Error searching illustrations: ${error instanceof Error ? error.message : "Unknown error"}`,
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
    .find(
      (obj: fabric.Object) =>
        (obj as unknown as { name?: string }).name === "workspace",
    );

  if (workspace) {
    const vpt = canvas.viewportTransform || [1, 0, 0, 1, 0, 0];
    const zoom = canvas.getZoom();
    return {
      left: (workspace.left || 0) * zoom + vpt[4],
      top: (workspace.top || 0) * zoom + vpt[5],
      width: (workspace.width || 800) * zoom,
      height: (workspace.height || 600) * zoom,
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

// resolve position preset
function resolvePositionToCoords(
  position: PositionPreset,
  workspaceBounds: { left: number; top: number; width: number; height: number },
  elementSize: { width: number; height: number },
): { x: number; y: number } {
  const margin = 0.1;
  const { left, top, width, height } = workspaceBounds;
  const marginX = width * margin;
  const marginY = height * margin;

  const positions: Record<PositionPreset, { x: number; y: number }> = {
    center: {
      x: left + width / 2 - elementSize.width / 2,
      y: top + height / 2 - elementSize.height / 2,
    },
    "top-left": { x: left + marginX, y: top + marginY },
    "top-center": {
      x: left + width / 2 - elementSize.width / 2,
      y: top + marginY,
    },
    "top-right": {
      x: left + width - marginX - elementSize.width,
      y: top + marginY,
    },
    "middle-left": {
      x: left + marginX,
      y: top + height / 2 - elementSize.height / 2,
    },
    "middle-right": {
      x: left + width - marginX - elementSize.width,
      y: top + height / 2 - elementSize.height / 2,
    },
    "bottom-left": {
      x: left + marginX,
      y: top + height - marginY - elementSize.height,
    },
    "bottom-center": {
      x: left + width / 2 - elementSize.width / 2,
      y: top + height - marginY - elementSize.height,
    },
    "bottom-right": {
      x: left + width - marginX - elementSize.width,
      y: top + height - marginY - elementSize.height,
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
  if (!canvas || !editor) {
    return { success: false, message: "Canvas or editor not available" };
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
      fabric.Image.fromURL(
        url,
        (image: fabric.Image | null) => {
          if (!image) {
            resolve({ success: false, message: "Failed to load image" });
            return;
          }

          const bounds = getWorkspaceBounds(canvas);
          const imgWidth = image.width || 200;
          const imgHeight = image.height || 200;

          // calculate scale to fit in workspace
          let scale = Math.min(
            (bounds.width * 0.5) / imgWidth,
            (bounds.height * 0.5) / imgHeight,
          );

          // apply target dimensions if specified
          if (targetWidth) {
            scale = targetWidth / imgWidth;
          } else if (targetHeight) {
            scale = targetHeight / imgHeight;
          }

          image.scale(scale);

          const scaledWidth = imgWidth * scale;
          const scaledHeight = imgHeight * scale;

          const coords = resolvePositionToCoords(position, bounds, {
            width: scaledWidth,
            height: scaledHeight,
          });

          image.set({
            left: coords.x,
            top: coords.y,
          });

          canvas.add(image);
          canvas.setActiveObject(image);
          canvas.renderAll();
          editor.save();

          const elementId = (image as unknown as { id?: string }).id;
          resolve({
            success: true,
            message: `Added image to canvas at ${position}`,
            elementId,
            data: {
              width: Math.round(scaledWidth),
              height: Math.round(scaledHeight),
            },
          });
        },
        { crossOrigin: "anonymous" },
      );
    });
  } catch (error) {
    return {
      success: false,
      message: `Error adding image: ${error instanceof Error ? error.message : "Unknown error"}`,
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
  const objects = canvas.getObjects().filter((obj: fabric.Object) => {
    const name = (obj as unknown as { name?: string }).name;
    return name !== "workspace";
  });

  if (elementId) {
    const byId = objects.find((obj: fabric.Object) => {
      const id = (obj as unknown as { id?: string }).id;
      return id === elementId;
    });
    if (byId) return byId;
  }

  if (elementQuery?.toLowerCase() === "selected") {
    const active = canvas.getActiveObject();
    if (active) return active;
  }

  if (elementQuery) {
    const query = elementQuery.toLowerCase();

    // find image elements
    const imageMatch = objects.find((obj: fabric.Object) => {
      if (obj.type === "image") {
        return true;
      }
      return false;
    });
    if (
      query.includes("image") ||
      query.includes("photo") ||
      query.includes("picture")
    ) {
      if (imageMatch) return imageMatch;
    }
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
  const elementQuery = params.elementQuery as string | undefined;

  // find the image element
  const element = findElement(
    canvas,
    elementId,
    elementQuery || "selected",
    canvasIndex,
  );
  if (!element) {
    return {
      success: false,
      message:
        "No image element found. Please select an image or specify which image to process.",
    };
  }

  if (element.type !== "image") {
    return {
      success: false,
      message:
        "Selected element is not an image. Background removal only works on images.",
    };
  }

  const imageElement = element as fabric.Image & { getSrc?: () => string };
  const imageSrc =
    imageElement.getSrc?.() ||
    (imageElement as unknown as { src?: string }).src;

  if (!imageSrc) {
    return { success: false, message: "Could not get image source" };
  }

  // if no bg removal function provided, return instructions
  if (!bgRemovalFn) {
    return {
      success: false,
      message:
        "Background removal requires the background removal hook. This operation will be performed in the UI.",
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
    const reader = new FileReader();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(resultBlob);
    });

    // replace the image source
    return new Promise((resolve) => {
      fabric.Image.fromURL(
        dataUrl,
        (newImage: fabric.Image | null) => {
          if (!newImage) {
            resolve({
              success: false,
              message: "Failed to load processed image",
            });
            return;
          }

          // copy properties from original
          newImage.set({
            left: imageElement.left,
            top: imageElement.top,
            scaleX: imageElement.scaleX,
            scaleY: imageElement.scaleY,
            angle: imageElement.angle,
          });

          // replace old with new
          canvas.remove(imageElement);
          canvas.add(newImage);
          canvas.setActiveObject(newImage);
          canvas.renderAll();
          editor?.save();

          resolve({
            success: true,
            message: "Background removed successfully",
          });
        },
        { crossOrigin: "anonymous" },
      );
    });
  } catch (error) {
    return {
      success: false,
      message: `Error removing background: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

// upload image to cloudinary
export async function uploadImageToCloudinary(
  blob: Blob,
  filename?: string,
): Promise<{ url: string; publicId: string; thumbnail: string } | null> {
  const cloudName = "dewj8he1y";
  const uploadPreset = "arture-upload-present";

  try {
    const formData = new FormData();
    const file = new File([blob], filename || `image-${Date.now()}.png`, {
      type: blob.type || "image/png",
    });

    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: formData,
      },
    );

    if (!response.ok) {
      console.error("Cloudinary upload failed:", response.status);
      return null;
    }

    const data = await response.json();

    if (!data.secure_url) {
      return null;
    }

    const url = data.secure_url as string;
    const publicId = data.public_id as string;
    const thumbnail = url.includes("/upload/")
      ? url.replace("/upload/", "/upload/w_200,h_200,c_fill/")
      : url;

    return { url, publicId, thumbnail };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return null;
  }
}

// upload data url to cloudinary
export async function uploadDataUrlToCloudinary(
  dataUrl: string,
  filename?: string,
): Promise<{ url: string; publicId: string; thumbnail: string } | null> {
  try {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    return uploadImageToCloudinary(blob, filename);
  } catch (error) {
    console.error("DataUrl to Cloudinary error:", error);
    return null;
  }
}

// asset tool executor map
export const assetToolExecutors: Record<
  string,
  (
    params: Record<string, unknown>,
    context: ToolContext,
    canvasIndex?: CanvasIndex,
  ) => Promise<ToolResult>
> = {
  search_images: executeSearchImages,
  search_illustrations: executeSearchIllustrations,
  add_image_to_canvas: executeAddImageToCanvas,
  remove_background: executeRemoveBackground,
};
