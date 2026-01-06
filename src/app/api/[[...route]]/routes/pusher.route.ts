import { Hono } from "hono";
import { Context } from "hono";
import { optionalAuthMiddleware } from "../middlewares/auth";

const pusherRoutes = new Hono();

let anonymousCounter = 0;

pusherRoutes.post("/auth", optionalAuthMiddleware, async (c: Context) => {
  const user = c.get("user");

  const body = await c.req.parseBody();
  const socketId = body.socket_id as string;
  const channelName = body.channel_name as string;

  if (!socketId || !channelName) {
    return c.json({ error: "Missing socket_id or channel_name" }, 400);
  }

  // only allow presence channels
  if (!channelName.startsWith("presence-")) {
    return c.json({ error: "Invalid channel" }, 403);
  }

  const appId =
    process.env.PUSHER_APPID || process.env.NEXT_PUBLIC_PUSHER_APPID;
  const key = process.env.PUSHER_KEY || process.env.NEXT_PUBLIC_PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;

  if (!appId || !key || !secret) {
    return c.json({ error: "Pusher not configured" }, 500);
  }

  // generate user data for presence channel
  let userData: { id: string; info: any };

  if (user) {
    userData = {
      id: user.id,
      info: {
        name: user.name || user.email?.split("@")[0] || "User",
        email: user.email,
        avatar: user.image,
        isAnonymous: false,
      },
    };
  } else {
    anonymousCounter += 1;
    const anonymousId = `anon-${Date.now()}-${anonymousCounter}`;
    userData = {
      id: anonymousId,
      info: {
        name: `Anonymous ${anonymousCounter}`,
        anonymousNumber: anonymousCounter,
        isAnonymous: true,
      },
    };
  }

  // generate pusher auth signature
  const stringToSign = `${socketId}:${channelName}:${JSON.stringify(userData)}`;

  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const msgData = encoder.encode(stringToSign);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, msgData);
  const signatureHex = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return c.json({
    auth: `${key}:${signatureHex}`,
    channel_data: JSON.stringify(userData),
  });
});

export default pusherRoutes;
