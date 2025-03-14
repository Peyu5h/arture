import { Hono } from "hono";
import authRoutes from "./auth";

const indexRoute = new Hono();

// test route
indexRoute.get("/", (c) => {
  return c.json({ message: "working" });
});

// routes
indexRoute.route("/auth", authRoutes);

export default indexRoute;
