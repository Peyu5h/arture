import { Hono } from "hono";
import authRoutes from "./auth";
import {
  createProject,
  getUserProjects,
  getUserProjectsById,
  updateUserProject,
} from "../controllers/projects.controller";
import { authMiddleware } from "../middlewares/auth";

const projectsRoutes = new Hono();

// test route
projectsRoutes.post("/", authMiddleware, createProject);
projectsRoutes.get("/", authMiddleware, getUserProjects);
projectsRoutes.get("/:id", authMiddleware, getUserProjectsById);
projectsRoutes.put("/:id", authMiddleware, updateUserProject);
// projectsRoutes.delete("/:id", authMiddleware, deleteUserProject);

export default projectsRoutes;
