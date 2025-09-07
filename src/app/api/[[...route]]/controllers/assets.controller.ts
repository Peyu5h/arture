import { Context } from "hono";
import { success, err } from "../utils/response";
import { AssetRepository } from "~/lib/repositories/asset.repository";
import { CloudinaryService } from "~/lib/cloudinary";
import { AssetAnalyzer } from "~/lib/ai/asset-analyzer";
import { AssetVectorDB } from "~/lib/vector-db";
import { prisma } from "~/lib/prisma";

const assetRepository = new AssetRepository();
const assetAnalyzer = new AssetAnalyzer();
const vectorDB = new AssetVectorDB();

export const debugRequest = async (c: Context) => {
  try {
    console.log("=== DEBUG REQUEST ===");
    console.log("Method:", c.req.method);
    console.log("URL:", c.req.url);

    const contentType = c.req.header("content-type");
    console.log("Content-Type:", contentType);

    if (contentType && contentType.includes("multipart/form-data")) {
      console.log("Attempting to parse FormData...");
      try {
        const formData = await c.req.formData();
        console.log("FormData parsed successfully");
        for (const [key, value] of formData.entries()) {
          console.log(`FormData entry - ${key}:`, value);
        }
        return c.json(success({ message: "FormData parsed successfully" }));
      } catch (parseError) {
        console.error("FormData parse error:", parseError);
        return c.json(err("FormData parse failed"), 400);
      }
    } else {
      console.log("Not multipart/form-data, attempting to parse as JSON...");
      try {
        const jsonData = await c.req.json();
        console.log("JSON data:", jsonData);
        return c.json(
          success({ message: "JSON parsed successfully", data: jsonData }),
        );
      } catch (jsonError) {
        console.error("JSON parse error:", jsonError);
        return c.json(err("JSON parse failed"), 400);
      }
    }
  } catch (error) {
    console.error("Debug request error:", error);
    return c.json(err("Debug request failed"), 500);
  }
};

export const checkEnvironment = async (c: Context) => {
  try {
    const env = {
      CLOUDINARY_CLOUD_NAME: !!process.env.CLOUDINARY_CLOUD_NAME,
      CLOUDINARY_API_KEY: !!process.env.CLOUDINARY_API_KEY,
      CLOUDINARY_API_SECRET: !!process.env.CLOUDINARY_API_SECRET,
      CLOUDINARY_UPLOAD_PRESET: !!process.env.CLOUDINARY_UPLOAD_PRESET,
    };

    console.log("Environment check:", env);

    return c.json(
      success({
        environment: env,
        message: "Environment variables check completed",
      }),
    );
  } catch (error) {
    console.error("Environment check error:", error);
    return c.json(err("Environment check failed"), 500);
  }
};

export const testUpload = async (c: Context) => {
  try {
    console.log("Test upload endpoint called");

    const contentType = c.req.header("content-type");
    console.log("Content-Type:", contentType);

    if (contentType && contentType.includes("multipart/form-data")) {
      const formData = await c.req.formData();
      const file = formData.get("file") as File;

      if (file) {
        console.log("File received in test:", file.name, file.type, file.size);
        return c.json(
          success({
            message: "FormData received successfully",
            fileName: file.name,
          }),
        );
      } else {
        return c.json(err("No file in FormData"), 400);
      }
    } else {
      return c.json(err("Content-Type is not multipart/form-data"), 400);
    }
  } catch (error) {
    console.error("Test upload error:", error);
    return c.json(err("Test upload failed"), 500);
  }
};

export const uploadAsset = async (c: Context) => {
  try {
    const userId = c.get("userId") || "admin";

    // Check if the request has the correct content type
    const contentType = c.req.header("content-type");
    console.log("Content-Type:", contentType);

    if (!contentType || !contentType.includes("multipart/form-data")) {
      console.error("Invalid Content-Type:", contentType);
      return c.json(err("Content-Type must be multipart/form-data"), 400);
    }

    const formData = await c.req.formData();
    const file = formData.get("file") as File;
    const userPrompt = formData.get("prompt") as string;

    if (!file) {
      return c.json(err("No file provided"), 400);
    }

    console.log("File received:", file.name, file.type, file.size);

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
    ];
    if (!allowedTypes.includes(file.type)) {
      return c.json(err("Invalid file type. Only images are allowed."), 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Check Cloudinary configuration
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      console.error("Missing Cloudinary configuration");
      return c.json(err("Cloudinary configuration is missing"), 500);
    }

    const uploadResult = await CloudinaryService.uploadAsset(buffer, {
      folder: "arture-assets",
      tags: ["arture", "design-asset"],
      uploadPreset:
        process.env.CLOUDINARY_UPLOAD_PRESET || "arture-upload-preset",
    });

    const analysis = await assetAnalyzer.analyzeAsset(
      uploadResult.url,
      file.name,
      uploadResult.size,
      { width: uploadResult.width, height: uploadResult.height },
    );

    const assetData = {
      name: analysis.name,
      type: analysis.type,
      category: analysis.category,
      tags: analysis.tags,
      theme: analysis.theme,
      color: analysis.color,
      size: {
        width: uploadResult.width,
        height: uploadResult.height,
        aspectRatio: uploadResult.width / uploadResult.height,
      },
      url: uploadResult.url,
      thumbnail: uploadResult.thumbnail,
      metadata: analysis.fabricMetadata,
      uploadedBy: userId,
      isPublic: true,
    };

    const asset = await assetRepository.create(assetData);

    // Try to generate description and embedding, but don't fail if it doesn't work
    try {
      const description = await assetAnalyzer.generateAssetDescription(asset);
      const embedding = await assetAnalyzer.generateEmbedding(description);
      await vectorDB.addAsset(asset, embedding);
    } catch (embeddingError) {
      console.error(
        "Failed to generate embedding, but asset was saved:",
        embeddingError,
      );
      // Asset is still saved, just without vector search capability
    }

    return c.json(
      success({
        asset,
        analysis,
        message: "Asset uploaded and analyzed successfully",
      }),
    );
  } catch (error) {
    console.error("Asset upload error:", error);
    return c.json(err("Failed to upload asset"), 500);
  }
};

export const getAssets = async (c: Context) => {
  try {
    const {
      search,
      type,
      category,
      tags,
      theme,
      color,
      page = 1,
      limit = 20,
    } = c.req.query();

    const filters: any = {};
    if (search) filters.search = search;
    if (type) filters.type = type;
    if (category) filters.category = category;
    if (tags) filters.tags = tags.split(",");
    if (theme) filters.theme = theme.split(",");
    if (color) filters.color = color;

    const assets = await assetRepository.findPublicAssets(filters);

    return c.json(
      success({
        assets,
        total: assets.length,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      }),
    );
  } catch (error) {
    console.error("Get assets error:", error);
    return c.json(err("Failed to get assets"), 500);
  }
};

export const searchAssets = async (c: Context) => {
  try {
    const { query, filters } = await c.req.json();

    if (!query) {
      return c.json(err("Search query is required"), 400);
    }

    try {
      // Generate embedding for search query
      const embedding = await assetAnalyzer.generateEmbedding(query);

      // Search in vector database
      const searchFilters = filters
        ? {
            type: filters.type,
            category: filters.category,
            tags: filters.tags,
            theme: filters.theme,
            color: filters.color,
          }
        : undefined;

      const vectorResults = await vectorDB.searchAssets(
        query,
        embedding,
        searchFilters,
      );

      // Get full asset data for results
      const assetIds = vectorResults.map((result) => result.id);
      const assets = await prisma.asset.findMany({
        where: { id: { in: assetIds } },
      });

      // Combine vector results with asset data
      const results = vectorResults
        .map((vectorResult) => {
          const asset = assets.find((a) => a.id === vectorResult.id);
          return {
            ...asset,
            score: vectorResult.score,
          };
        })
        .filter(Boolean);

      return c.json(
        success({
          assets: results,
          total: results.length,
          query,
          searchType: "vector",
        }),
      );
    } catch (vectorError) {
      console.error(
        "Vector search failed, falling back to regular search:",
        vectorError,
      );

      // Fallback to regular database search
      const searchFilters: any = {};
      if (filters?.type) searchFilters.type = filters.type;
      if (filters?.category) searchFilters.category = filters.category;
      if (filters?.tags) searchFilters.tags = { hasSome: filters.tags };
      if (filters?.theme) searchFilters.theme = { hasSome: filters.theme };
      if (filters?.color) searchFilters.color = filters.color;

      // Add text search if query is provided
      if (query) {
        searchFilters.OR = [
          { name: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { category: { contains: query, mode: "insensitive" } },
        ];
      }

      const assets = await assetRepository.findPublicAssets(searchFilters);

      return c.json(
        success({
          assets: assets.map((asset) => ({ ...asset, score: 1.0 })),
          total: assets.length,
          query,
          searchType: "database",
        }),
      );
    }
  } catch (error) {
    console.error("Search assets error:", error);
    return c.json(err("Failed to search assets"), 500);
  }
};

export const getAssetById = async (c: Context) => {
  try {
    const { id } = c.req.param();

    const asset = await assetRepository.findById(id);
    if (!asset) {
      return c.json(err("Asset not found"), 404);
    }

    return c.json(success({ asset }));
  } catch (error) {
    console.error("Get asset error:", error);
    return c.json(err("Failed to get asset"), 500);
  }
};

export const getPopularAssets = async (c: Context) => {
  try {
    const { limit = 20 } = c.req.query();

    const assets = await assetRepository.getPopularAssets(
      parseInt(limit as string),
    );

    return c.json(success({ assets }));
  } catch (error) {
    console.error("Get popular assets error:", error);
    return c.json(err("Failed to get popular assets"), 500);
  }
};

export const getAssetsByCategory = async (c: Context) => {
  try {
    const { category } = c.req.param();

    const assets = await assetRepository.getAssetsByCategory(category);

    return c.json(success({ assets }));
  } catch (error) {
    console.error("Get assets by category error:", error);
    return c.json(err("Failed to get assets by category"), 500);
  }
};

export const getAssetsByType = async (c: Context) => {
  try {
    const { type } = c.req.param();

    const assets = await assetRepository.getAssetsByType(type as any);

    return c.json(success({ assets }));
  } catch (error) {
    console.error("Get assets by type error:", error);
    return c.json(err("Failed to get assets by type"), 500);
  }
};

export const deleteAsset = async (c: Context) => {
  try {
    const { id } = c.req.param();
    const userId = c.get("userId");

    const asset = await assetRepository.findById(id);
    if (!asset) {
      return c.json(err("Asset not found"), 404);
    }

    // Only allow deletion by uploader or admin
    if (asset.uploadedBy !== userId) {
      return c.json(err("Unauthorized"), 403);
    }

    // Delete from Cloudinary
    const publicId = (asset.metadata as any)?.publicId;
    if (publicId) {
      await CloudinaryService.deleteAsset(publicId);
    }

    // Delete from vector database
    await vectorDB.deleteAsset(id);

    // Delete from database
    await assetRepository.delete(id);

    return c.json(success({ message: "Asset deleted successfully" }));
  } catch (error) {
    console.error("Delete asset error:", error);
    return c.json(err("Failed to delete asset"), 500);
  }
};

export const updateAsset = async (c: Context) => {
  try {
    const { id } = c.req.param();
    const userId = c.get("userId");
    const updateData = await c.req.json();

    const asset = await assetRepository.findById(id);
    if (!asset) {
      return c.json(err("Asset not found"), 404);
    }

    // Only allow updates by uploader or admin
    if (asset.uploadedBy !== userId) {
      return c.json(err("Unauthorized"), 403);
    }

    const updatedAsset = await assetRepository.update(id, updateData);

    // Update vector database if metadata changed
    if (
      updateData.name ||
      updateData.tags ||
      updateData.theme ||
      updateData.category
    ) {
      const description =
        await assetAnalyzer.generateAssetDescription(updatedAsset);
      const embedding = await assetAnalyzer.generateEmbedding(description);
      await vectorDB.updateAsset(updatedAsset, embedding);
    }

    return c.json(success({ asset: updatedAsset }));
  } catch (error) {
    console.error("Update asset error:", error);
    return c.json(err("Failed to update asset"), 500);
  }
};
