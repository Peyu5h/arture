import { Hono } from "hono";
import authRoutes from "./auth";
import projectsRoutes from "./projects.route";
import assetsRoutes from "./assets.route";

const indexRoute = new Hono();

// test route
indexRoute.get("/", (c) => {
  return c.json({ message: "working" });
});

// routes
indexRoute.route("/auth", authRoutes);
indexRoute.route("/projects", projectsRoutes);
indexRoute.route("/assets", assetsRoutes);

export default indexRoute;
