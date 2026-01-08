import { Context } from "hono";
import { z } from "zod";

import {
  createConversationSchema,
  updateConversationSchema,
  createMessageSchema,
  generateTitleSchema,
} from "../schemas/chat.schema";
import { err, success, validationErr } from "../utils/response";
import { prisma } from "~/lib/prisma";
import { generateToolsDescription } from "~/lib/ai/tools/schemas";

// available gemini models - updated to working models
const GEMINI_MODELS = [
  // --- MOST RELIABLE FREE TIER MODELS ---
  "gemini-3-flash-preview", // Latest 3.0 series, fast and highly intelligent
  "gemini-2.5-flash", // Stable, high rate limits, great for production
  "gemini-2.5-flash-lite", // Most cost-efficient, extremely fast

  // --- CAPABILITY-SPECIFIC / EXPERIMENTAL ---
  "gemini-3-pro-preview", // Most powerful reasoning, limited free access
  "gemini-2.5-pro", // High reasoning, stable version
  "gemini-2.0-flash", // Previous stable generation
  "gemini-2.0-flash-lite", // Previous lite generation
] as const;

// openrouter models for fallback - fast models first
const OPENROUTER_MODELS = [
  "anthropic/claude-3-haiku",
  "google/gemini-flash-1.5-8b",
] as const;

// shorter timeout for faster fallback
const GEMINI_TIMEOUT_MS = 12000;
const OPENROUTER_TIMEOUT_MS = 10000;

// get all available gemini api keys
function getGeminiApiKeys(): string[] {
  const keys: string[] = [];
  const primary = process.env.GEMINI_API_KEY;
  if (primary) keys.push(primary);

  for (let i = 2; i <= 5; i++) {
    const key = process.env[`GEMINI_API_KEY_${i}`];
    if (key) keys.push(key);
  }
  return keys;
}

// get openrouter api keys
function getOpenRouterApiKeys(): string[] {
  const keys: string[] = [];
  const primary = process.env.OPENROUTER_API_KEY;
  if (primary) keys.push(primary);

  for (let i = 2; i <= 5; i++) {
    const key = process.env[`OPENROUTER_API_KEY_${i}`];
    if (key) keys.push(key);
  }
  return keys;
}

// track rate limited keys with expiry
const rateLimitedKeys = new Map<string, number>();
const rateLimitedModels = new Map<string, number>();

// get next available gemini api key
function getAvailableGeminiKey(): string | null {
  const keys = getGeminiApiKeys();
  const now = Date.now();

  for (const key of keys) {
    const expiry = rateLimitedKeys.get(key);
    if (!expiry || now > expiry) {
      rateLimitedKeys.delete(key);
      return key;
    }
  }
  return null;
}

// get next available openrouter key
function getAvailableOpenRouterKey(): string | null {
  const keys = getOpenRouterApiKeys();
  const now = Date.now();

  for (const key of keys) {
    const expiry = rateLimitedKeys.get(key);
    if (!expiry || now > expiry) {
      rateLimitedKeys.delete(key);
      return key;
    }
  }
  return null;
}

// get next available model
function getAvailableModel(): string {
  const now = Date.now();

  for (const model of GEMINI_MODELS) {
    const expiry = rateLimitedModels.get(model);
    if (!expiry || now > expiry) {
      rateLimitedModels.delete(model);
      return model;
    }
  }
  return GEMINI_MODELS[0];
}

// mark key as rate limited
function markKeyRateLimited(key: string, retryAfterMs: number = 60000) {
  rateLimitedKeys.set(key, Date.now() + retryAfterMs);
}

// mark model as rate limited
function markModelRateLimited(model: string, retryAfterMs: number = 60000) {
  rateLimitedModels.set(model, Date.now() + retryAfterMs);
}

// check if error is rate limit
function isRateLimitError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return msg.includes("rate") || msg.includes("429") || msg.includes("quota");
  }
  return false;
}

// extract retry delay from error
function extractRetryDelay(error: unknown): number {
  if (error instanceof Error) {
    const match = error.message.match(/retry in (\d+\.?\d*)/i);
    if (match) {
      return Math.ceil(parseFloat(match[1]) * 1000);
    }
  }
  return 15000; // default 15s for faster retry
}

// try gemini with direct fetch and timeout
async function tryGeminiDirect(
  apiKey: string,
  modelName: string,
  systemPrompt: string,
  userContent: string,
  timeoutMs: number = GEMINI_TIMEOUT_MS,
): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const requestBody = {
      contents: [
        {
          role: "user",
          parts: [{ text: `${systemPrompt}\n\nUSER REQUEST: ${userContent}` }],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 4096,
        topP: 0.8,
        responseMimeType: "application/json",
      },
    };

    console.log("[GEMINI_REQUEST]", {
      model: modelName,
      userContent: userContent.slice(0, 200),
      systemPromptLength: systemPrompt.length,
    });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      },
    );
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    console.log("[GEMINI_RAW_RESPONSE]", {
      model: modelName,
      rawText: text?.slice(0, 500),
      finishReason: data.candidates?.[0]?.finishReason,
    });

    if (!text) throw new Error("No response from Gemini");
    return text.trim();
  } catch (e) {
    clearTimeout(timeoutId);
    throw e;
  }
}

// call openrouter api with timeout - optimized
async function callOpenRouter(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userContent:
    | string
    | Array<{ type: string; text?: string; image_url?: string }>,
  timeoutMs: number = 15000,
): Promise<string> {
  const userContentStr =
    typeof userContent === "string" ? userContent : JSON.stringify(userContent);

  console.log("[OPENROUTER_REQUEST]", {
    model,
    userContent: userContentStr.slice(0, 200),
    systemPromptLength: systemPrompt.length,
  });

  const messages = [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content:
        typeof userContent === "string"
          ? userContent
          : userContent.map((part) => {
              if (part.type === "text") {
                return { type: "text", text: part.text };
              }
              if (part.type === "image_url" && part.image_url) {
                return {
                  type: "image_url",
                  image_url: { url: part.image_url },
                };
              }
              return part;
            }),
    },
  ];

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer":
            process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
          "X-Title": "Arture Design Editor",
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: 4096,
          temperature: 0.2,
        }),
        signal: controller.signal,
      },
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";

    console.log("[OPENROUTER_RAW_RESPONSE]", {
      model,
      rawText: text.slice(0, 500),
      finishReason: data.choices?.[0]?.finish_reason,
    });

    return text;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      throw new Error(`OpenRouter timeout after ${timeoutMs}ms`);
    }
    throw error;
  }
}

async function generateTitleWithAI(query: string): Promise<string> {
  const apiKey = getAvailableGeminiKey();
  if (!apiKey) {
    return generateTitleFallback(query);
  }

  try {
    const { ChatGoogleGenerativeAI } = await import("@langchain/google-genai");
    const modelName = getAvailableModel();

    const model = new ChatGoogleGenerativeAI({
      model: modelName,
      apiKey,
      temperature: 0.3,
      maxOutputTokens: 50,
    });

    const prompt = `Generate a very short title (3-5 words) for a design conversation that starts with this message. Only output the title, nothing else.

Message: "${query.slice(0, 100)}"

Title:`;

    const result = await model.invoke(prompt);
    const title = result.content
      .toString()
      .trim()
      .replace(/^["']|["']$/g, "")
      .slice(0, 50);

    return title || generateTitleFallback(query);
  } catch (error) {
    console.error("Title generation error:", error);
    return generateTitleFallback(query);
  }
}

// fallback title generation
function generateTitleFallback(query: string): string {
  const words = query.split(" ").slice(0, 5);
  let title = words.join(" ");
  if (query.split(" ").length > 5) {
    title += "...";
  }
  return title || "New Chat";
}

// get conversations
export const getConversations = async (c: Context) => {
  try {
    const user = c.get("user");
    if (!user?.id) {
      return c.json(err("Unauthorized"), 401);
    }
    const userId = user.id;

    const projectId = c.req.query("projectId");

    const conversations = await prisma.chatConversation.findMany({
      where: {
        userId,
        ...(projectId ? { projectId } : {}),
      },
      orderBy: {
        updatedAt: "desc",
      },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
          select: { content: true, role: true },
        },
        _count: { select: { messages: true } },
      },
    });

    const formatted = conversations.map((c) => ({
      id: c.id,
      title: c.title,
      projectId: c.projectId,
      createdAt: c.createdAt.getTime(),
      updatedAt: c.updatedAt.getTime(),
      messageCount: c._count.messages,
      preview: c.messages[0]?.content?.slice(0, 100),
    }));

    return c.json(success(formatted));
  } catch (error) {
    console.error("GetConversations error:", error);
    return c.json(err("Failed to get conversations"), 500);
  }
};

// get single conversation with messages
export const getConversation = async (c: Context) => {
  try {
    const user = c.get("user");
    if (!user?.id) {
      return c.json(err("Unauthorized"), 401);
    }
    const userId = user.id;

    const id = c.req.param("id");

    const conversation = await prisma.chatConversation.findFirst({
      where: { id, userId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!conversation) {
      return c.json(err("Conversation not found"), 404);
    }

    return c.json(
      success({
        id: conversation.id,
        title: conversation.title,
        projectId: conversation.projectId,
        context: conversation.context,
        createdAt: conversation.createdAt.getTime(),
        updatedAt: conversation.updatedAt.getTime(),
        messages: conversation.messages.map((m) => ({
          id: m.id,
          role: m.role.toLowerCase(),
          content: m.content,
          actions: m.actions,
          context: m.context,
          timestamp: m.createdAt.getTime(),
        })),
      }),
    );
  } catch (error) {
    console.error("GetConversation error:", error);
    return c.json(err("Failed to get conversation"), 500);
  }
};

// create new conversation
export const createConversation = async (c: Context) => {
  try {
    const user = c.get("user");
    if (!user?.id) {
      return c.json(err("Unauthorized"), 401);
    }
    const userId = user.id;

    const body = await c.req.json();
    const result = createConversationSchema.safeParse(body);
    if (!result.success) {
      return c.json(validationErr(result.error), 400);
    }

    const { title, projectId, context } = result.data;

    const conversation = await prisma.chatConversation.create({
      data: {
        title: title || "New Chat",
        userId,
        projectId,
        context,
      },
    });

    return c.json(
      success({
        id: conversation.id,
        title: conversation.title,
        projectId: conversation.projectId,
        createdAt: conversation.createdAt.getTime(),
        updatedAt: conversation.updatedAt.getTime(),
        messageCount: 0,
      }),
      201,
    );
  } catch (error) {
    console.error("CreateConversation error:", error);
    return c.json(err("Failed to create conversation"), 500);
  }
};

// update conversation
export const updateConversation = async (c: Context) => {
  try {
    const user = c.get("user");
    if (!user?.id) {
      return c.json(err("Unauthorized"), 401);
    }
    const userId = user.id;

    const id = c.req.param("id");
    const body = await c.req.json();
    const result = updateConversationSchema.safeParse(body);
    if (!result.success) {
      return c.json(validationErr(result.error), 400);
    }

    const existing = await prisma.chatConversation.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return c.json(err("Conversation not found"), 404);
    }

    const conversation = await prisma.chatConversation.update({
      where: { id },
      data: result.data,
    });

    return c.json(
      success({
        id: conversation.id,
        title: conversation.title,
        updatedAt: conversation.updatedAt.getTime(),
      }),
    );
  } catch (error) {
    console.error("UpdateConversation error:", error);
    return c.json(err("Failed to update conversation"), 500);
  }
};

// delete conversation
export const deleteConversation = async (c: Context) => {
  try {
    const user = c.get("user");
    if (!user?.id) {
      return c.json(err("Unauthorized"), 401);
    }
    const userId = user.id;

    const id = c.req.param("id");

    const existing = await prisma.chatConversation.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      return c.json(err("Conversation not found"), 404);
    }

    await prisma.chatConversation.delete({
      where: { id },
    });

    return c.json(success({ deleted: true }));
  } catch (error) {
    console.error("DeleteConversation error:", error);
    return c.json(err("Failed to delete conversation"), 500);
  }
};

// add message to conversation
export const createMessage = async (c: Context) => {
  try {
    const user = c.get("user");
    if (!user?.id) {
      return c.json(err("Unauthorized"), 401);
    }
    const userId = user.id;

    const body = await c.req.json();
    const result = createMessageSchema.safeParse(body);
    if (!result.success) {
      return c.json(validationErr(result.error), 400);
    }

    const { conversationId, role, content, actions, context } = result.data;

    const conversation = await prisma.chatConversation.findFirst({
      where: { id: conversationId, userId },
    });

    if (!conversation) {
      return c.json(err("Conversation not found"), 404);
    }

    const message = await prisma.chatMessage.create({
      data: {
        conversationId,
        role,
        content,
        actions,
        context,
      },
    });

    // update conversation title if it's first user message
    if (role === "USER" && conversation.title === "New Chat") {
      const title = await generateTitleWithAI(content);
      await prisma.chatConversation.update({
        where: { id: conversationId },
        data: { title },
      });
    } else {
      await prisma.chatConversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });
    }

    return c.json(
      success({
        id: message.id,
        role: message.role.toLowerCase(),
        content: message.content,
        actions: message.actions,
        context: message.context,
        timestamp: message.createdAt.getTime(),
      }),
      201,
    );
  } catch (error) {
    console.error("CreateMessage error:", error);
    return c.json(err("Failed to create message"), 500);
  }
};

// generate title from query using ai
export const generateTitle = async (c: Context) => {
  try {
    const body = await c.req.json();
    const result = generateTitleSchema.safeParse(body);
    if (!result.success) {
      return c.json(validationErr(result.error), 400);
    }

    const title = await generateTitleWithAI(result.data.query);
    return c.json(success({ title }));
  } catch (error) {
    console.error("GenerateTitle error:", error);
    return c.json(err("Failed to generate title"), 500);
  }
};

// ai chat response schema with canvas context and image attachments
const aiChatSchema = z.object({
  message: z.string().min(1),
  context: z
    .object({
      elements: z.array(z.record(z.unknown())).optional(),
      canvasSize: z
        .object({
          width: z.number(),
          height: z.number(),
        })
        .optional(),
      backgroundColor: z.string().optional(),
      summary: z.string().optional(),
    })
    .optional(),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      }),
    )
    .optional(),
  canvasIndex: z.record(z.unknown()).optional(),
  imageAttachments: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        cloudinaryUrl: z.string().optional(),
        thumbnail: z.string().optional(),
        dataUrl: z.string().optional(),
      }),
    )
    .optional(),
});

// builds compact action-aware system prompt
function buildActionSystemPrompt(
  contextInfo: string,
  historyContext: string,
  imageContext: string,
): string {
  return `You are Arture AI, a canvas design assistant. You MUST respond with ONLY valid JSON - no other text.

OUTPUT FORMAT - respond with exactly this structure:
{"message":"<your response>","actions":[<action objects>]}

ACTIONS REFERENCE:

spawn_shape - Create shapes
{"type":"spawn_shape","payload":{"shapeType":"<circle|rectangle|triangle|star|hexagon>","options":{"fill":"#HEX","position":"<position>","width":150,"height":150}},"description":"<desc>"}

add_text - Add text
{"type":"add_text","payload":{"text":"<content>","fontSize":72,"fontFamily":"Arial","fill":"#000000","position":"<position>"},"description":"<desc>"}

search_images - Find and add images
{"type":"search_images","payload":{"query":"<search terms>","count":1,"position":"<position>","width":500,"height":400},"description":"<desc>"}

modify_element - Change selected element
{"type":"modify_element","payload":{"elementQuery":"selected","properties":{"fill":"#HEX"}},"description":"<desc>"}

delete_element - Remove selected
{"type":"delete_element","payload":{"elementQuery":"selected"},"description":"<desc>"}

change_canvas_background - Set background
{"type":"change_canvas_background","payload":{"color":"#HEX"},"description":"<desc>"}

POSITIONS: center, top-left, top-center, top-right, middle-left, middle-right, bottom-left, bottom-center, bottom-right

EXAMPLES:

User: "Add a red circle at top left"
{"message":"I've added a red circle at the top-left corner.","actions":[{"type":"spawn_shape","payload":{"shapeType":"circle","options":{"fill":"#FF0000","position":"top-left","width":150,"height":150}},"description":"Red circle at top-left"}]}

User: "Add blue rectangle bottom right and text HELLO at top center"
{"message":"I've added a blue rectangle at the bottom-right and 'HELLO' text at the top-center.","actions":[{"type":"spawn_shape","payload":{"shapeType":"rectangle","options":{"fill":"#0000FF","position":"bottom-right","width":200,"height":150}},"description":"Blue rectangle"},{"type":"add_text","payload":{"text":"HELLO","fontSize":72,"fontFamily":"Arial","fill":"#000000","position":"top-center"},"description":"HELLO text"}]}

User: "Search for mountain image and add to center"
{"message":"I'm searching for a mountain image and adding it to the center.","actions":[{"type":"search_images","payload":{"query":"mountain landscape nature","count":1,"position":"center","width":500,"height":400},"description":"Mountain image search"}]}

User: "hello" or general chat
{"message":"Hello! I can help you design on the canvas. Try asking me to add shapes, text, or search for images.","actions":[]}

CRITICAL RULES:
- Output ONLY the JSON object, nothing else
- No markdown, no code blocks, no explanations outside JSON
- Always include both "message" and "actions" keys
- "actions" must be an array (empty [] if no canvas actions needed)
- For design requests, always include relevant actions
${contextInfo ? `\nCANVAS: ${contextInfo.slice(0, 400)}` : ""}${historyContext ? `\nHISTORY: ${historyContext.slice(0, 150)}` : ""}`;
}

// parallel ai response - tries gemini and openrouter simultaneously
export const generateAIResponse = async (c: Context) => {
  try {
    const user = c.get("user");
    if (!user?.id) {
      return c.json(err("Unauthorized"), 401);
    }

    const body = await c.req.json();
    const result = aiChatSchema.safeParse(body);
    if (!result.success) {
      return c.json(validationErr(result.error), 400);
    }

    const {
      message,
      context,
      conversationHistory,
      canvasIndex,
      imageAttachments,
    } = result.data;

    const geminiKeys = getGeminiApiKeys();
    const openRouterKeys = getOpenRouterApiKeys();

    if (geminiKeys.length === 0 && openRouterKeys.length === 0) {
      return c.json(
        success({
          response:
            "I'm here to help with your design! However, the AI service is not configured yet. Please add your API keys to enable AI capabilities.",
          isConfigured: false,
          actions: [],
        }),
      );
    }

    // build context
    let contextInfo = "";
    const selectedElementIds = (context as { selectedElementIds?: string[] })
      ?.selectedElementIds;
    if (context) {
      if (context.canvasSize) {
        contextInfo += `Canvas: ${context.canvasSize.width}x${context.canvasSize.height}px. `;
      }
      if (context.backgroundColor) {
        contextInfo += `Background: ${context.backgroundColor}. `;
      }
      if (selectedElementIds && selectedElementIds.length > 0) {
        contextInfo += `SELECTED: ${selectedElementIds.join(",")}. `;
      }
      // simplified element list - only include essential info
      if (context.elements && context.elements.length > 0) {
        const elements = context.elements.slice(0, 8).map((e) => {
          const type = String(e.type || "?");
          const sel = e.isSelected ? "*" : "";
          return `${type}${sel}`;
        });
        contextInfo += `Elements: ${elements.join(", ")}. `;
      }
    }

    // skip detailed indexed context for speed - already have basic info
    if (canvasIndex) {
      const idx = canvasIndex as {
        elementCount?: number;
        canvas?: { width: number; height: number };
      };
      if (idx.canvas && !context?.canvasSize) {
        contextInfo += `Canvas: ${idx.canvas.width}x${idx.canvas.height}. `;
      }
    }

    // build image attachments context
    let imageContext = "";
    if (imageAttachments && imageAttachments.length > 0) {
      imageContext = imageAttachments
        .map((img, i) => {
          const url = img.cloudinaryUrl || img.dataUrl?.slice(0, 50) + "...";
          return `${i + 1}. ${img.name}: ${url}`;
        })
        .join("\n");
    }

    // build conversation history
    let historyContext = "";
    if (conversationHistory && conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-6);
      historyContext = recentHistory
        .map((h) => `${h.role === "user" ? "User" : "Assistant"}: ${h.content}`)
        .join("\n");
    }

    const systemPrompt = buildActionSystemPrompt(
      contextInfo,
      historyContext,
      imageContext,
    );

    // build user content
    let userContent:
      | string
      | Array<{ type: string; text?: string; image_url?: string }>;

    if (imageAttachments && imageAttachments.length > 0) {
      const contentParts: Array<{
        type: string;
        text?: string;
        image_url?: string;
      }> = [{ type: "text", text: message }];

      for (const img of imageAttachments) {
        const imageUrl = img.cloudinaryUrl || img.dataUrl;
        if (imageUrl) {
          contentParts.push({
            type: "image_url",
            image_url: imageUrl,
          });
        }
      }
      userContent = contentParts;
    } else {
      userContent = message;
    }

    let lastError: unknown = null;

    const normalizeAction = (a: unknown): unknown => {
      const action = a as Record<string, unknown>;
      if (action.type === "spawn_shape" && action.payload) {
        const p = action.payload as Record<string, unknown>;
        if (!p.options) {
          const { shapeType, ...rest } = p;
          return { ...action, payload: { shapeType, options: rest } };
        }
      }
      return action;
    };

    const tryParseJson = (
      jsonStr: string,
    ): { message?: string; actions?: unknown[] } | null => {
      try {
        const result = JSON.parse(jsonStr);
        return result;
      } catch (e1) {
        // try to fix common issues
        let fixed = jsonStr.trim();

        // remove trailing commas before ] or }
        fixed = fixed.replace(/,\s*([}\]])/g, "$1");

        // ensure proper closing
        const openBraces = (fixed.match(/\{/g) || []).length;
        const closeBraces = (fixed.match(/\}/g) || []).length;
        const openBrackets = (fixed.match(/\[/g) || []).length;
        const closeBrackets = (fixed.match(/\]/g) || []).length;

        if (openBrackets > closeBrackets) {
          fixed += "]".repeat(openBrackets - closeBrackets);
        }
        if (openBraces > closeBraces) {
          fixed += "}".repeat(openBraces - closeBraces);
        }

        try {
          const result = JSON.parse(fixed);
          console.log("[PARSE_JSON] Fixed JSON successfully");
          return result;
        } catch (e2) {
          console.log("[PARSE_JSON_FAILED]", {
            originalError: e1 instanceof Error ? e1.message : String(e1),
            fixedError: e2 instanceof Error ? e2.message : String(e2),
            jsonPreview: jsonStr.slice(0, 200),
          });
          return null;
        }
      }
    };

    const parseResponse = (
      text: string,
    ): { message: string; actions: unknown[] } => {
      console.log("[PARSE_RESPONSE_INPUT]", {
        textLength: text.length,
        textPreview: text.slice(0, 500),
        fullText: text,
      });

      let parsedMessage = text;
      let actions: unknown[] = [];

      // clean text - remove markdown artifacts
      let cleanText = text.trim();

      // remove markdown code blocks if present
      const codeBlockMatch = cleanText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        cleanText = codeBlockMatch[1].trim();
        console.log(
          "[PARSE_RESPONSE] Extracted from code block:",
          cleanText.slice(0, 200),
        );
      }

      // try direct JSON parse first (most common case)
      if (cleanText.startsWith("{")) {
        const parsed = tryParseJson(cleanText);
        if (parsed) {
          console.log("[PARSE_RESPONSE_SUCCESS] Direct JSON parse", {
            hasMessage: !!parsed.message,
            actionsCount: parsed.actions?.length || 0,
            actions: JSON.stringify(parsed.actions || []).slice(0, 500),
          });
          if (parsed.message) parsedMessage = parsed.message;
          if (parsed.actions && Array.isArray(parsed.actions)) {
            actions = parsed.actions.map(normalizeAction);
          }
          return { message: parsedMessage, actions };
        }
      }

      // try to find JSON object with actions array
      const actionsMatch = cleanText.match(
        /\{[^{}]*"actions"\s*:\s*\[[\s\S]*?\][^{}]*\}/,
      );
      if (actionsMatch) {
        console.log(
          "[PARSE_RESPONSE] Found actions pattern:",
          actionsMatch[0].slice(0, 200),
        );
        const parsed = tryParseJson(actionsMatch[0]);
        if (parsed) {
          console.log("[PARSE_RESPONSE_SUCCESS] Actions pattern matched", {
            hasMessage: !!parsed.message,
            actionsCount: parsed.actions?.length || 0,
          });
          if (parsed.message) parsedMessage = parsed.message;
          if (parsed.actions && Array.isArray(parsed.actions)) {
            actions = parsed.actions.map(normalizeAction);
          }
          return { message: parsedMessage, actions };
        }
      }

      // try to find any JSON object with message field
      const messageMatch = cleanText.match(/\{[^{}]*"message"\s*:[^{}]*\}/);
      if (messageMatch) {
        console.log(
          "[PARSE_RESPONSE] Found message pattern:",
          messageMatch[0].slice(0, 200),
        );
        const parsed = tryParseJson(messageMatch[0]);
        if (parsed) {
          console.log("[PARSE_RESPONSE_SUCCESS] Message pattern matched");
          if (parsed.message) parsedMessage = parsed.message;
          if (parsed.actions && Array.isArray(parsed.actions)) {
            actions = parsed.actions.map(normalizeAction);
          }
          return { message: parsedMessage, actions };
        }
      }

      // last resort: try to extract any valid JSON from the text
      const jsonStart = cleanText.indexOf("{");
      const jsonEnd = cleanText.lastIndexOf("}");
      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        const potentialJson = cleanText.slice(jsonStart, jsonEnd + 1);
        console.log(
          "[PARSE_RESPONSE] Trying substring extraction:",
          potentialJson.slice(0, 200),
        );
        const parsed = tryParseJson(potentialJson);
        if (parsed) {
          console.log("[PARSE_RESPONSE_SUCCESS] Substring extraction worked");
          if (parsed.message) parsedMessage = parsed.message;
          if (parsed.actions && Array.isArray(parsed.actions)) {
            actions = parsed.actions.map(normalizeAction);
          }
          return { message: parsedMessage, actions };
        }
      }

      // complete fallback - no valid JSON found
      console.log(
        "[PARSE_RESPONSE_FALLBACK] No valid JSON found, raw text:",
        cleanText,
      );
      parsedMessage = cleanText
        .replace(/```(?:json)?[\s\S]*$/g, "")
        .replace(/\{[\s\S]*$/g, "")
        .trim();

      if (!parsedMessage || parsedMessage.length < 5) {
        parsedMessage =
          "I received your request but couldn't generate a proper response. Please try again with a clearer instruction like 'Add a red circle at the center'.";
      }

      return { message: parsedMessage, actions };
    };

    // try gemini with first available key (fast)
    const userContentStr =
      typeof userContent === "string"
        ? userContent
        : JSON.stringify(userContent);

    console.log("[AI_REQUEST]", {
      message: message.slice(0, 100),
      contextInfo: contextInfo.slice(0, 200),
      historyLength: conversationHistory?.length || 0,
      imageCount: imageAttachments?.length || 0,
    });

    for (const geminiKey of geminiKeys) {
      const expiry = rateLimitedKeys.get(geminiKey);
      if (expiry && Date.now() < expiry) continue;

      const modelName = getAvailableModel();
      try {
        console.log(`Trying Gemini ${modelName}`);
        const responseText = await tryGeminiDirect(
          geminiKey,
          modelName,
          systemPrompt,
          userContentStr,
          GEMINI_TIMEOUT_MS,
        );
        console.log(`✓ Gemini ${modelName} success`);
        const { message, actions } = parseResponse(responseText);

        console.log("[AI_RESPONSE_FINAL]", {
          model: `gemini:${modelName}`,
          messagePreview: message.slice(0, 100),
          actionsCount: actions.length,
          actions: JSON.stringify(actions).slice(0, 500),
        });

        return c.json(
          success({
            response: message,
            isConfigured: true,
            actions,
            model: `gemini:${modelName}`,
          }),
        );
      } catch (e) {
        lastError = e;
        const errMsg = e instanceof Error ? e.message : String(e);
        console.warn(`Gemini ${modelName} failed: ${errMsg.slice(0, 100)}`);
        if (isRateLimitError(e)) {
          const delay = extractRetryDelay(e);
          markKeyRateLimited(geminiKey, delay);
          markModelRateLimited(modelName, delay);
        }
        // try next model for same key
        markModelRateLimited(modelName, 5000);
      }
    }

    // fallback to openrouter with faster timeout
    const openRouterKey = getAvailableOpenRouterKey();
    if (openRouterKey) {
      for (const modelName of OPENROUTER_MODELS) {
        try {
          console.log(`Trying OpenRouter: ${modelName}`);
          const responseText = await callOpenRouter(
            openRouterKey,
            modelName,
            systemPrompt,
            userContent,
            OPENROUTER_TIMEOUT_MS,
          );
          console.log(`✓ OpenRouter ${modelName} success`);
          const { message, actions } = parseResponse(responseText);

          console.log("[AI_RESPONSE_FINAL]", {
            model: `openrouter:${modelName}`,
            messagePreview: message.slice(0, 100),
            actionsCount: actions.length,
            actions: JSON.stringify(actions).slice(0, 500),
          });

          return c.json(
            success({
              response: message,
              isConfigured: true,
              actions,
              model: `openrouter:${modelName}`,
            }),
          );
        } catch (e: unknown) {
          lastError = e;
          console.warn(`OpenRouter ${modelName} failed`);
          continue;
        }
      }
    }

    console.error("All AI providers failed:", lastError);
    return c.json(
      success({
        response: "Request failed. Please try again.",
        isConfigured: true,
        error: true,
        actions: [],
      }),
    );
  } catch (error) {
    console.error("GenerateAIResponse error:", error);
    return c.json(err("Failed to generate AI response"), 500);
  }
};
