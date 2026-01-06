import { Hono } from "hono";
import {
  createProject,
  getUserProjects,
  getUserProjectsById,
  updateUserProject,
  deleteProject,
  createShareLink,
  getProjectShares,
  deleteShareLink,
  getProjectByShareToken,
} from "../controllers/projects.controller";
import { authMiddleware, optionalAuthMiddleware } from "../middlewares/auth";

const projectsRoutes = new Hono();

// protected routes
projectsRoutes.post("/", authMiddleware, createProject);
projectsRoutes.get("/", authMiddleware, getUserProjects);
projectsRoutes.put("/:id", authMiddleware, updateUserProject);
projectsRoutes.delete("/:id", authMiddleware, deleteProject);

// share routes
projectsRoutes.post("/:id/share", authMiddleware, createShareLink);
projectsRoutes.get("/:id/shares", authMiddleware, getProjectShares);
projectsRoutes.delete("/:id/shares/:shareId", authMiddleware, deleteShareLink);

// get project by id - uses optional auth to allow share token access
projectsRoutes.get("/:id", optionalAuthMiddleware, getUserProjectsById);

export default projectsRoutes;
