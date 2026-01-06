import { Hono } from "hono";
import {
  getConversations,
  getConversation,
  createConversation,
  updateConversation,
  deleteConversation,
  createMessage,
  generateTitle,
  generateAIResponse,
} from "../controllers/chat.controller";
import { authMiddleware } from "../middlewares/auth";

const chatRoutes = new Hono();

// conversations
chatRoutes.get("/conversations", authMiddleware, getConversations);
chatRoutes.get("/conversations/:id", authMiddleware, getConversation);
chatRoutes.post("/conversations", authMiddleware, createConversation);
chatRoutes.put("/conversations/:id", authMiddleware, updateConversation);
chatRoutes.delete("/conversations/:id", authMiddleware, deleteConversation);

// messages
chatRoutes.post("/messages", authMiddleware, createMessage);

// utils
chatRoutes.post("/generate-title", authMiddleware, generateTitle);

// ai response
chatRoutes.post("/ai-response", authMiddleware, generateAIResponse);

export default chatRoutes;
