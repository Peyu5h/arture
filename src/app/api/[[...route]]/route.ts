import { Hono } from "hono";
import { handle } from "hono/vercel";
import { cors } from "hono/cors";
import users from "./routes/users.route";

const app = new Hono().basePath("/api");

app.use(
  "*",
  cors({
    origin: "*",
    credentials: true,
  }),
);

app.get("/", (c) => {
  return c.json({
    message: "WORKING",
  });
});

app.route("/users", users);

export const GET = handle(app);
export const POST = handle(app);
export const DELETE = handle(app);
