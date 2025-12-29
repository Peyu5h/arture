import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dkysrpdi6",
  api_key: process.env.CLOUDINARY_API_KEY || "154346211332761",
  api_secret: process.env.CLOUDINARY_API_SECRET || "uup5UzKTbwaRt3FATIySWtTxitk",
});

export interface UploadResult {
  url: string;
  thumbnail: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  size: number;
}

export interface AssetUploadOptions {
  folder?: string;
  transformation?: any;
  tags?: string[];
  uploadPreset?: string; // Added upload preset support
}

export class CloudinaryService {
  static async uploadAsset(
    file: Buffer | string,
    options: AssetUploadOptions = {},
  ): Promise<UploadResult> {
    try {
      if (
        !process.env.CLOUDINARY_CLOUD_NAME ||
        !process.env.CLOUDINARY_API_KEY ||
        !process.env.CLOUDINARY_API_SECRET
      ) {
        throw new Error("Cloudinary configuration is missing");
      }

      console.log("Uploading to Cloudinary with options:", {
        folder: options.folder,
        tags: options.tags,
        uploadPreset: options.uploadPreset,
      });

      const uploadOptions = {
        folder: options.folder || "arture-assets",
        tags: options.tags || ["arture", "design-asset"],
        transformation: {
          quality: "auto",
          fetch_format: "auto",
          ...options.transformation,
        },
        // Add upload preset if provided
        ...(options.uploadPreset && { upload_preset: options.uploadPreset }),
      };

      console.log("Final upload options:", uploadOptions);

      let result: any;

      if (Buffer.isBuffer(file)) {
        // Convert Buffer to base64 string for Cloudinary
        const base64Data = file.toString("base64");
        const dataURI = `data:image/png;base64,${base64Data}`;

        result = await cloudinary.uploader.upload(dataURI, uploadOptions);
      } else {
        // If it's already a string (file path), use it directly
        result = await cloudinary.uploader.upload(file, uploadOptions);
      }

      console.log("Cloudinary upload result:", {
        public_id: result.public_id,
        secure_url: result.secure_url,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes,
      });

      // Generate thumbnail
      const thumbnailUrl = cloudinary.url(result.public_id, {
        transformation: [
          { width: 200, height: 200, crop: "fill", quality: "auto" },
        ],
      });

      return {
        url: result.secure_url,
        thumbnail: thumbnailUrl,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        size: result.bytes,
      };
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      throw new Error(
        `Failed to upload asset to Cloudinary: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  static async uploadImage(
    file: Buffer | string,
    options: AssetUploadOptions = {},
  ): Promise<UploadResult> {
    return this.uploadAsset(file, {
      ...options,
      folder: options.folder || "arture-assets/images",
    });
  }

  static async uploadIcon(
    file: Buffer | string,
    options: AssetUploadOptions = {},
  ): Promise<UploadResult> {
    return this.uploadAsset(file, {
      ...options,
      folder: options.folder || "arture-assets/icons",
      transformation: {
        quality: "auto",
        fetch_format: "auto",
        background: "transparent",
      },
    });
  }

  static async uploadShape(
    file: Buffer | string,
    options: AssetUploadOptions = {},
  ): Promise<UploadResult> {
    return this.uploadAsset(file, {
      ...options,
      folder: options.folder || "arture-assets/shapes",
      transformation: {
        quality: "auto",
        fetch_format: "auto",
        background: "transparent",
      },
    });
  }

  static async deleteAsset(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error("Cloudinary delete error:", error);
      throw new Error("Failed to delete asset from Cloudinary");
    }
  }

  static async getAssetInfo(publicId: string): Promise<any> {
    try {
      const result = await cloudinary.api.resource(publicId);
      return result;
    } catch (error) {
      console.error("Cloudinary info error:", error);
      throw new Error("Failed to get asset info from Cloudinary");
    }
  }

  static generateThumbnailUrl(
    publicId: string,
    width: number = 200,
    height: number = 200,
  ): string {
    return cloudinary.url(publicId, {
      transformation: [{ width, height, crop: "fill", quality: "auto" }],
    });
  }

  static generateOptimizedUrl(publicId: string, options: any = {}): string {
    return cloudinary.url(publicId, {
      transformation: [{ quality: "auto", fetch_format: "auto", ...options }],
    });
  }
}
