import { Hono } from "hono";
import {
  getTemplates,
  getTemplateById,
  createTemplate,
  deleteTemplate,
  updateTemplate,
} from "../controllers/templates.controller";
import { authMiddleware } from "../middlewares/auth";

const templatesRoutes = new Hono();

// public routes
templatesRoutes.get("/", getTemplates);
templatesRoutes.get("/:id", getTemplateById);

// admin-only routes
templatesRoutes.post("/", authMiddleware, createTemplate);
templatesRoutes.patch("/:id", authMiddleware, updateTemplate);
templatesRoutes.delete("/:id", authMiddleware, deleteTemplate);

export default templatesRoutes;
