import { useState, useCallback } from "react";
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
  uploading: boolean;
  uploadError?: string;
}

interface UseImageAttachmentsReturn {
  attachments: ImageAttachment[];
  isUploading: boolean;
  addAttachment: (file: File) => Promise<void>;
  addAttachmentFromDataUrl: (dataUrl: string, name?: string) => Promise<void>;
  removeAttachment: (id: string) => void;
  uploadAllPending: () => Promise<ImageAttachment[]>;
  clearAll: () => void;
  getUploadedAttachments: () => ImageAttachment[];
}

const generateId = () => Math.random().toString(36).substring(2, 10);

// compress image before upload
async function compressImage(
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

export function useImageAttachments(): UseImageAttachmentsReturn {
  const [attachments, setAttachments] = useState<ImageAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // add attachment from file
  const addAttachment = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      console.warn("Not an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      console.warn("Image too large, max 10MB");
      return;
    }

    const id = generateId();

    // read file as data url
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const dataUrl = e.target?.result as string;
        const compressed = await compressImage(dataUrl);

        const attachment: ImageAttachment = {
          id,
          dataUrl: compressed,
          name: file.name,
          size: file.size,
          uploaded: false,
          uploading: false,
        };

        setAttachments((prev) => [...prev, attachment]);
      } catch (error) {
        console.error("Failed to process image:", error);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  // add attachment from data url (paste)
  const addAttachmentFromDataUrl = useCallback(
    async (dataUrl: string, name: string = "pasted-image.png") => {
      try {
        const compressed = await compressImage(dataUrl);
        const id = generateId();

        const attachment: ImageAttachment = {
          id,
          dataUrl: compressed,
          name,
          uploaded: false,
          uploading: false,
        };

        setAttachments((prev) => [...prev, attachment]);
      } catch (error) {
        console.error("Failed to process pasted image:", error);
      }
    },
    [],
  );

  // remove attachment
  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  // upload a single attachment
  const uploadSingleAttachment = async (
    attachment: ImageAttachment,
  ): Promise<ImageAttachment> => {
    if (attachment.uploaded || attachment.cloudinaryUrl) {
      return attachment;
    }

    if (!attachment.dataUrl) {
      return { ...attachment, uploadError: "No image data" };
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
        uploading: false,
        dataUrl: undefined,
      };
    } catch (error) {
      return {
        ...attachment,
        uploadError: error instanceof Error ? error.message : "Upload failed",
        uploading: false,
      };
    }
  };

  // upload all pending attachments
  const uploadAllPending = useCallback(async (): Promise<ImageAttachment[]> => {
    const pendingAttachments = attachments.filter(
      (a) => !a.uploaded && !a.cloudinaryUrl && a.dataUrl,
    );

    if (pendingAttachments.length === 0) {
      return attachments;
    }

    setIsUploading(true);

    // mark all as uploading
    setAttachments((prev) =>
      prev.map((a) =>
        pendingAttachments.some((p) => p.id === a.id)
          ? { ...a, uploading: true }
          : a,
      ),
    );

    try {
      const uploadPromises = pendingAttachments.map(uploadSingleAttachment);
      const results = await Promise.all(uploadPromises);

      // update attachments with results
      setAttachments((prev) =>
        prev.map((a) => {
          const result = results.find((r) => r.id === a.id);
          return result || a;
        }),
      );

      return results;
    } finally {
      setIsUploading(false);
    }
  }, [attachments]);

  // clear all attachments
  const clearAll = useCallback(() => {
    setAttachments([]);
  }, []);

  // get only uploaded attachments
  const getUploadedAttachments = useCallback(() => {
    return attachments.filter((a) => a.uploaded || a.cloudinaryUrl);
  }, [attachments]);

  return {
    attachments,
    isUploading,
    addAttachment,
    addAttachmentFromDataUrl,
    removeAttachment,
    uploadAllPending,
    clearAll,
    getUploadedAttachments,
  };
}
