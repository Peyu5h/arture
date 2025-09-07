import { Hono } from "hono";
import { authServer } from "~/lib/auth-server";
import { err } from "../utils/response";

const authRoutes = new Hono();

// Handle all auth routes with Better Auth handler
authRoutes.all("*", async (c) => {
  try {
    return await authServer.handler(c.req.raw);
  } catch (error) {
    console.error("Auth handler error:", error);
    return c.json(err("Authentication error"), 500);
  }
});

export default authRoutes;
