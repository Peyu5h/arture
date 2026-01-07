// image context service for handling chat image attachments

import { uploadDataUrlToCloudinary } from "~/lib/cloudinary-upload";

export interface ImageAttachment {
  id: string;
  dataUrl?: string;
  cloudinaryUrl?: string;
  publicId?: string;
  thumbnail?: string;
  name: string;
  width?: number;
  height?: number;
  size?: number;
  uploaded: boolean;
  uploadError?: string;
}

export interface CanvasImageInfo {
  id: string;
  src: string;
  thumbnail?: string;
  description?: string;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
}

export interface ImageContext {
  attachments: ImageAttachment[];
  canvasImages: CanvasImageInfo[];
  totalImages: number;
}

// generate unique id
const generateId = () => Math.random().toString(36).substring(2, 10);

// compress image before upload
export async function compressImage(
  dataUrl: string,
  maxWidth: number = 1200,
  quality: number = 0.8,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const compressed = canvas.toDataURL("image/jpeg", quality);
      resolve(compressed);
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = dataUrl;
  });
}

// create image attachment from file
export async function createImageAttachment(
  file: File,
): Promise<ImageAttachment> {
  const id = generateId();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const dataUrl = reader.result as string;
        const compressed = await compressImage(dataUrl);

        resolve({
          id,
          dataUrl: compressed,
          name: file.name,
          size: file.size,
          uploaded: false,
        });
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

// create image attachment from data url
export async function createImageAttachmentFromDataUrl(
  dataUrl: string,
  name: string = "pasted-image.png",
): Promise<ImageAttachment> {
  const id = generateId();
  const compressed = await compressImage(dataUrl);

  return {
    id,
    dataUrl: compressed,
    name,
    uploaded: false,
  };
}

// upload image attachment to cloudinary
export async function uploadImageAttachment(
  attachment: ImageAttachment,
): Promise<ImageAttachment> {
  if (!attachment.dataUrl) {
    return { ...attachment, uploadError: "No image data to upload" };
  }

  try {
    const result = await uploadDataUrlToCloudinary(
      attachment.dataUrl,
      attachment.name,
    );

    return {
      ...attachment,
      cloudinaryUrl: result.url,
      publicId: result.publicId,
      thumbnail: result.thumbnail,
      uploaded: true,
      dataUrl: undefined,
    };
  } catch (error) {
    return {
      ...attachment,
      uploadError: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

// upload multiple image attachments
export async function uploadImageAttachments(
  attachments: ImageAttachment[],
): Promise<ImageAttachment[]> {
  const results = await Promise.all(
    attachments.map((attachment) => {
      if (attachment.uploaded || attachment.cloudinaryUrl) {
        return Promise.resolve(attachment);
      }
      return uploadImageAttachment(attachment);
    }),
  );
  return results;
}

// extract image info from canvas object
export function extractCanvasImageInfo(
  obj: fabric.Object,
): CanvasImageInfo | null {
  if (obj.type !== "image") {
    return null;
  }

  const imageObj = obj as fabric.Image;
  const id = (obj as unknown as { id?: string }).id || "";
  const src =
    imageObj.getSrc?.() || (imageObj as unknown as { src?: string }).src || "";

  if (!src) {
    return null;
  }

  return {
    id,
    src,
    position: {
      x: Math.round(obj.left || 0),
      y: Math.round(obj.top || 0),
    },
    size: {
      width: Math.round((obj.width || 100) * (obj.scaleX || 1)),
      height: Math.round((obj.height || 100) * (obj.scaleY || 1)),
    },
  };
}

// get all images from canvas
export function getCanvasImages(canvas: fabric.Canvas): CanvasImageInfo[] {
  const images: CanvasImageInfo[] = [];

  canvas.getObjects().forEach((obj) => {
    if (obj.type === "image") {
      const info = extractCanvasImageInfo(obj);
      if (info) {
        images.push(info);
      }
    }
  });

  return images;
}

// build image context for AI
export function buildImageContext(
  attachments: ImageAttachment[],
  canvas?: fabric.Canvas | null,
): ImageContext {
  const canvasImages = canvas ? getCanvasImages(canvas) : [];

  return {
    attachments: attachments.filter((a) => a.cloudinaryUrl || a.dataUrl),
    canvasImages,
    totalImages: attachments.length + canvasImages.length,
  };
}

// format image context for ai prompt
export function formatImageContextForPrompt(context: ImageContext): string {
  const parts: string[] = [];

  if (context.attachments.length > 0) {
    parts.push(`\nATTACHED IMAGES (${context.attachments.length}):`);
    context.attachments.forEach((img, i) => {
      const url = img.cloudinaryUrl || img.dataUrl?.slice(0, 50) + "...";
      parts.push(`${i + 1}. ${img.name}: ${url}`);
    });
  }

  if (context.canvasImages.length > 0) {
    parts.push(`\nIMAGES ON CANVAS (${context.canvasImages.length}):`);
    context.canvasImages.forEach((img, i) => {
      const srcPreview =
        img.src.slice(0, 60) + (img.src.length > 60 ? "..." : "");
      parts.push(
        `${i + 1}. id=${img.id}: at (${img.position?.x || 0},${img.position?.y || 0}), ` +
          `size ${img.size?.width || 0}x${img.size?.height || 0}px, src=${srcPreview}`,
      );
    });
  }

  return parts.join("\n");
}

// convert image context to serializable format for storage
export function serializeImageContext(
  context: ImageContext,
): Record<string, unknown> {
  return {
    attachments: context.attachments.map((a) => ({
      id: a.id,
      name: a.name,
      cloudinaryUrl: a.cloudinaryUrl,
      thumbnail: a.thumbnail,
      publicId: a.publicId,
      width: a.width,
      height: a.height,
    })),
    canvasImages: context.canvasImages.map((img) => ({
      id: img.id,
      src: img.src.slice(0, 200), // truncate long data urls
      position: img.position,
      size: img.size,
    })),
    totalImages: context.totalImages,
  };
}

// get image urls from context (for ai vision features)
export function getImageUrls(context: ImageContext): string[] {
  const urls: string[] = [];

  // add attachment urls (prefer cloudinary)
  context.attachments.forEach((a) => {
    if (a.cloudinaryUrl) {
      urls.push(a.cloudinaryUrl);
    } else if (a.dataUrl) {
      urls.push(a.dataUrl);
    }
  });

  // add canvas image urls
  context.canvasImages.forEach((img) => {
    if (img.src && !img.src.startsWith("data:")) {
      urls.push(img.src);
    }
  });

  return urls;
}
