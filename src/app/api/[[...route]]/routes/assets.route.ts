import { Hono } from "hono";
import { authMiddleware } from "../middlewares/auth";
import {
  uploadAsset,
  testUpload,
  checkEnvironment,
  debugRequest,
  getAssets,
  searchAssets,
  getAssetById,
  getPopularAssets,
  getAssetsByCategory,
  getAssetsByType,
  deleteAsset,
  updateAsset,
  deleteCloudinaryImage,
  fuzzySearchAssets,
  getSimilarWords,
} from "../controllers/assets.controller";

const assetsRoutes = new Hono();

// Public routes (no auth required)
assetsRoutes.get("/", getAssets);
assetsRoutes.get("/fuzzy-search", fuzzySearchAssets);
assetsRoutes.get("/popular", getPopularAssets);
assetsRoutes.get("/category/:category", getAssetsByCategory);
assetsRoutes.get("/type/:type", getAssetsByType);
assetsRoutes.get("/:id", getAssetById);

// Test routes for debugging
assetsRoutes.get("/test/env", checkEnvironment);
assetsRoutes.post("/test-upload", testUpload);
assetsRoutes.post("/debug", debugRequest);

// Temporarily remove auth for upload to test
assetsRoutes.post("/upload", uploadAsset);
assetsRoutes.post("/search", authMiddleware, searchAssets);
assetsRoutes.post("/suggest-words", getSimilarWords);

// Protected routes (auth required)
assetsRoutes.delete("/:id", authMiddleware, deleteAsset);
assetsRoutes.put("/:id", authMiddleware, updateAsset);

// Cloudinary image deletion (for user-uploaded images)
assetsRoutes.post("/cloudinary/delete", deleteCloudinaryImage);

export default assetsRoutes;

