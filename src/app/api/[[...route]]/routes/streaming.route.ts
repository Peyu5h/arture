import { Hono } from "hono";
import {
  startSession,
  getSession,
  streamAIResponse,
  getSessionEvents,
  healthCheck,
} from "../controllers/streaming.controller";
import { authMiddleware } from "../middlewares/auth";

const streamingRoutes = new Hono();

// health check
streamingRoutes.get("/health", healthCheck);

// session management
streamingRoutes.post("/start-session", authMiddleware, startSession);
streamingRoutes.get("/sessions/:id", authMiddleware, getSession);
streamingRoutes.get("/sessions/:id/events", authMiddleware, getSessionEvents);

// streaming ai response
streamingRoutes.post("/stream", authMiddleware, streamAIResponse);

export default streamingRoutes;
