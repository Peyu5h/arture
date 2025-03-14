// src/app/api/[[...route]]/middleware/auth.ts
import { createMiddleware } from "hono/factory";
import { auth } from "~/lib/auth";
import { err } from "../utils/response";
import { verify } from "jsonwebtoken";

export const authMiddleware = createMiddleware(async (c, next) => {
  try {
    const authHeader = c.req.header("Authorization");

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);

      try {
        // Only use JWT verification in Edge runtime
        const secret = process.env.BETTER_AUTH_SECRET || "your-secret-key";
        const decoded = verify(token, secret) as {
          sub: string;
          name?: string;
          email?: string;
        };

        // Set minimal user info from token
        c.set("user", {
          id: decoded.sub,
          name: decoded.name || "User",
          email: decoded.email || "",
        });
        c.set("authMethod", "jwt");
        return next();
      } catch (jwtError) {
        console.error("JWT validation error:", jwtError);
      }
    }

    // Try to get session from cookie-based auth
    try {
      const session = await auth.api.getSession({ headers: c.req.raw.headers });

      if (session) {
        c.set("user", session.user);
        c.set("session", session.session);
        c.set("authMethod", "session");
        return next();
      }
    } catch (sessionError) {
      console.error("Session error:", sessionError);
    }

    return c.json(
      err("Unauthorized. Please sign in or provide a valid token"),
      401,
    );
  } catch (error) {
    console.error("Authentication error:", error);
    return c.json(err("Authentication failed"), 401);
  }
});
