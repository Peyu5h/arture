import { Hono } from "hono";
import authRoutes from "./auth";
import projectsRoutes from "./projects.route";
import assetsRoutes from "./assets.route";
import proxyRoutes from "./proxy.route";
import pixabayRoutes from "./pixabay.route";
import pexelsRoutes from "./pexels.route";
import templatesRoutes from "./templates.route";
import pusherRoutes from "./pusher.route";
import chatRoutes from "./chat.route";
import streamingRoutes from "./streaming.route";

const indexRoute = new Hono();

// test route
indexRoute.get("/", (c) => {
  return c.json({ message: "working" });
});

// routes
indexRoute.route("/auth", authRoutes);
indexRoute.route("/projects", projectsRoutes);
indexRoute.route("/assets", assetsRoutes);
indexRoute.route("/proxy", proxyRoutes);
indexRoute.route("/pixabay", pixabayRoutes);
indexRoute.route("/pexels", pexelsRoutes);
indexRoute.route("/templates", templatesRoutes);
indexRoute.route("/pusher", pusherRoutes);
indexRoute.route("/chat", chatRoutes);
indexRoute.route("/streaming", streamingRoutes);

export default indexRoute;
