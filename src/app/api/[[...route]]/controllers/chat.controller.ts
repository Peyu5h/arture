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

const GEMINI_MODELS = [
  "gemini-3-flash-preview",
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-2.5-pro",
  "gemini-2.5-flash-lite",
] as const;

const OPENROUTER_MODELS = [
  "anthropic/claude-3-haiku",
  "google/gemini-flash-1.5-8b",
] as const;

const GEMINI_TIMEOUT_MS = 12000;
const OPENROUTER_TIMEOUT_MS = 10000;

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

const rateLimitedKeys = new Map<string, number>();
const rateLimitedModels = new Map<string, number>();

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

function markKeyRateLimited(key: string, retryAfterMs: number = 60000) {
  rateLimitedKeys.set(key, Date.now() + retryAfterMs);
}

function markModelRateLimited(model: string, retryAfterMs: number = 60000) {
  rateLimitedModels.set(model, Date.now() + retryAfterMs);
}

function isRateLimitError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return msg.includes("rate") || msg.includes("429") || msg.includes("quota");
  }
  return false;
}

function extractRetryDelay(error: unknown): number {
  if (error instanceof Error) {
    const match = error.message.match(/retry in (\d+\.?\d*)/i);
    if (match) {
      return Math.ceil(parseFloat(match[1]) * 1000);
    }
  }
  return 15000;
}

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

function generateTitleFallback(query: string): string {
  const words = query.split(" ").slice(0, 5);
  let title = words.join(" ");
  if (query.split(" ").length > 5) {
    title += "...";
  }
  return title || "New Chat";
}

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

// generate title from query using llm
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

// builds compact action-aware system prompt with design intelligence
function buildActionSystemPrompt(
  contextInfo: string,
  historyContext: string,
  imageContext: string,
): string {
  return `You are Arture AI, a professional canvas design assistant. You MUST respond with ONLY valid JSON - no other text.

OUTPUT FORMAT:
{"message":"<response>","actions":[<actions>],"ui_component_request":<optional>}

=== DESIGN FLOW FOR INVITATIONS/POSTERS/CARDS ===

STEP 1: When user asks to create a design (wedding invitation, birthday card, poster, etc.):
- First search for templates using search_templates action with SEMANTIC KEYWORDS
- Detect design type: wedding, birthday, event, poster, card, etc
- Use specific search queries that match the design intent
- Example: {"message":"Let me find some templates for you!","actions":[{"type":"search_templates","payload":{"category":"invitations","query":"wedding elegant"},"description":"Searching templates"}]}

DESIGN TYPE DETECTION (use appropriate query):
- Wedding: use "wedding", "marriage", "elegant", "romantic"


STEP 2: If templates found, show template_gallery UI component:
{"message":"I found some templates!","ui_component_request":{"componentType":"template_gallery","props":{"title":"Choose a Template","templates":[{"id":"t1","name":"Elegant Gold"}],"allowScratch":true}}}

STEP 3: If NO templates found OR user chooses "start from scratch", show design_wizard:
{"message":"Let's create your design from scratch! I need some details.","ui_component_request":{"componentType":"design_wizard","props":{"designType":"wedding|birthday|event|poster|card|generic","title":"Wedding Invitation Details"},"followUpPrompt":"Now creating your invitation..."}}

STEP 4: After receiving design requirements from wizard, execute canvas actions:
- Set background (solid or gradient)
- Add main heading text with proper typography
- Add date/venue text
- Search and add decorative images from Pixabay
- Apply proper positioning and layering

=== DESIGN INTELLIGENCE ===

COLOR THEORY (apply automatically):
- Dark bg (#1A1A2E, #000) → light text (#FFF, #F8F9FA)
- Light bg (#FFF, #F8F9FA) → dark text (#1A1A2E, #212529)
- Limit to 3-5 colors per design

TYPOGRAPHY PAIRINGS:
- Wedding/Elegant: Playfair Display + Lato
- Party/Birthday: Fredoka One + Quicksand
- Corporate/Modern: Montserrat + Open Sans
- Romantic: Great Vibes + Quicksand

=== ACTIONS REFERENCE ===

spawn_shape - Create shapes
{"type":"spawn_shape","payload":{"shapeType":"circle|rectangle|triangle|star|hexagon","options":{"fill":"#HEX","position":"center","width":150,"height":150}}}

add_text - Add text with proper typography
{"type":"add_text","payload":{"text":"Content","fontSize":72,"fontFamily":"Playfair Display","fill":"#HEX","position":"top-center","fontWeight":"bold"}}

search_images - Search and add images/vectors/stickers from Pixabay
{"type":"search_images","payload":{"query":"wedding flowers","count":1,"position":"bottom-center","width":400,"height":300,"image_type":"photo|vector|illustration"}}

CRITICAL - DECORATIVE ELEMENTS (STICKERS/VECTORS/ILLUSTRATIONS):
- ALWAYS use image_type:"vector" or image_type:"illustration" for decorations/stickers
- Use SIMPLE, 1-2 word search terms that DIRECTLY MATCH THE DESIGN THEME
- Add multiple decorations in PARALLEL (3-5 different decorations in same response)
- Position strategically: top-left, top-right, bottom-left, bottom-right, middle-left, middle-right
- Keep decorations smaller: width:80-150, height:80-150 (don't overwhelm the design)

**CRITICAL: DECORATIONS MUST MATCH THE DESIGN CONTEXT - EXTRACT KEYWORDS FROM USER PROMPT**
- If user says "gym poster" → use "dumbbell", "barbell", "fitness", "muscle", "workout"
- If user says "birthday" → use "balloon", "cake", "confetti", "gift", "party"
- If user says "wedding" → use "rings", "flower", "heart", "rose", "dove"
- If user says "restaurant" → use "fork", "plate", "chef", "food", "kitchen"
- If user says "music" → use "guitar", "music note", "headphones", "speaker"
- If user says "tech/startup" → use "laptop", "coding", "rocket", "lightbulb"
- If user says "nature" → use "tree", "leaf", "mountain", "sun", "flower"
- If user says "sports" → use the specific sport: "basketball", "football", "tennis"
- NEVER use random generic decorations (house, random animals, unrelated objects)
- ALWAYS analyze the user's original prompt to determine appropriate decoration keywords

NOTE: Keep search terms to 1-2 words maximum. Pixabay works better with simple generic terms.

POSITION STRATEGY:
- Main text: center
- Subtitle: slightly below center
- Date/details: bottom-center
- Decoration 1: top-left (80-120px)
- Decoration 2: top-right (80-120px)
- Decoration 3: bottom-left (80-120px)
- Decoration 4: bottom-right (80-120px)
- Optional decoration 5: middle-left or middle-right (60-100px)

add_image_to_canvas - Add specific image by URL
{"type":"add_image_to_canvas","payload":{"url":"https://...","position":"center","width":500,"height":400}}

change_canvas_background - Solid background
{"type":"change_canvas_background","payload":{"color":"#1a1a2e"}}

apply_gradient_background - Gradient background
{"type":"apply_gradient_background","payload":{"colors":["#1a1a2e","#16213e","#0f3460"],"direction":"vertical|horizontal|diagonal"}}

set_image_background - Use image as background
{"type":"set_image_background","payload":{"query":"elegant texture"}}

modify_element - Change element properties
{"type":"modify_element","payload":{"elementQuery":"element_id|selected","properties":{"fill":"#HEX","opacity":0.8}}}

delete_element - Remove element
{"type":"delete_element","payload":{"elementQuery":"element_id|selected"}}

bring_to_front - Bring element to front layer
{"type":"bring_to_front","payload":{"elementQuery":"element_id|selected"}}

send_to_back - Send element to back layer
{"type":"send_to_back","payload":{"elementQuery":"element_id|selected"}}

bring_forward - Move element one layer up
{"type":"bring_forward","payload":{"elementQuery":"element_id|selected"}}

send_backward - Move element one layer down
{"type":"send_backward","payload":{"elementQuery":"element_id|selected"}}

resize_element - Resize element
{"type":"resize_element","payload":{"elementQuery":"element_id|selected","width":300,"height":200}}

search_templates - Search template library
{"type":"search_templates","payload":{"category":"invitations|events|resume|poster|cards|business","query":"wedding"}}

take_canvas_screenshot - Capture canvas state for visual feedback
{"type":"take_canvas_screenshot","payload":{}}

suggest_palette - Get color palette suggestions
{"type":"suggest_palette","payload":{"baseColor":"#d4af37","harmony":"complementary|analogous|triadic"}}

suggest_fonts - Get font pairing suggestions
{"type":"suggest_fonts","payload":{"mood":"elegant|modern|playful|romantic"}}

audit_design - Check design for issues
{"type":"audit_design","payload":{}}

POSITIONS: center, top-left, top-center, top-right, middle-left, middle-right, bottom-left, bottom-center, bottom-right

=== UI COMPONENTS ===

template_gallery - Show templates with "start from scratch" option
{"ui_component_request":{"componentType":"template_gallery","props":{"title":"Templates","templates":[],"category":"invitations","allowScratch":true,"noResultsMessage":"No templates found"}}}

design_wizard - Multi-step design input collection
{"ui_component_request":{"componentType":"design_wizard","props":{"designType":"wedding|birthday|event|poster|card|generic","title":"Design Details"}}}

style_carousel - Theme/style selection
{"ui_component_request":{"componentType":"style_carousel","props":{"title":"Choose Theme","options":[{"id":"elegant","name":"Elegant","colors":["#1a1a2e","#d4af37"],"preview":""}]}}}

date_picker - Date/time selection
{"ui_component_request":{"componentType":"date_picker","props":{"title":"Event Date","showTime":true}}}

choice_selector - Multiple choice selection
{"ui_component_request":{"componentType":"choice_selector","props":{"title":"Select Option","options":[{"id":"a","label":"Option A"}]}}}

=== @ REFERENCED ELEMENTS ===
When message contains "[Referenced elements: @Name (ID: "id123", Type: type)]":
- Use the ID directly: {"type":"delete_element","payload":{"elementQuery":"id123"}}

=== EXAMPLES ===

User: "Help me create a wedding invitation"
{"message":"I'll help you create a beautiful wedding invitation! Let me search for elegant templates first.","actions":[{"type":"search_templates","payload":{"category":"invitations","query":"wedding elegant romantic"},"description":"Searching wedding templates"}]}

User: "create a birthday invitation for Sarah turning 30"
{"message":"Let me find some fun birthday templates!","actions":[{"type":"search_templates","payload":{"category":"invitations","query":"birthday celebration party fun"},"description":"Searching birthday templates"}]}

User: "create a birthday invitation"
{"message":"Let me find some fun birthday templates for you!","actions":[{"type":"search_templates","payload":{"category":"invitations","query":"birthday celebration party"},"description":"Searching birthday templates"}]}

User: "make a poster for an event"
{"message":"I'll search for event poster templates!","actions":[{"type":"search_templates","payload":{"category":"poster","query":"event professional modern"},"description":"Searching poster templates"}]}

User: "start from scratch" (after template search returns nothing or user chooses scratch)
{"message":"Let's create your wedding invitation from scratch! I'll need a few details.","actions":[],"ui_component_request":{"componentType":"design_wizard","props":{"designType":"wedding","title":"Wedding Invitation Details","description":"Fill in the details for your beautiful invitation"}}}

User: (after wizard submission with data for WEDDING like primaryText:"John & Jane", colorPalette, fontPairing, includeDecorations:true)
{"message":"Creating your elegant wedding invitation!","actions":[{"type":"apply_gradient_background","payload":{"colors":["#1a1a2e","#2d2d44"],"direction":"vertical"},"description":"Setting elegant gradient"},{"type":"add_text","payload":{"text":"John & Jane","fontSize":72,"fontFamily":"Playfair Display","fill":"#d4af37","position":"center","fontWeight":"bold"},"description":"Adding couple names"},{"type":"add_text","payload":{"text":"are getting married","fontSize":24,"fontFamily":"Lato","fill":"#f5f5f5","position":"center"},"description":"Adding subtitle"},{"type":"add_text","payload":{"text":"June 15, 2024 • 4:00 PM","fontSize":20,"fontFamily":"Lato","fill":"#f5f5f5","position":"bottom-center"},"description":"Adding date"},{"type":"search_images","payload":{"query":"rings","image_type":"vector","count":1,"position":"top-left","width":100,"height":100},"description":"Adding rings decoration"},{"type":"search_images","payload":{"query":"rose","image_type":"vector","count":1,"position":"top-right","width":110,"height":110},"description":"Adding rose decoration"},{"type":"search_images","payload":{"query":"heart","image_type":"vector","count":1,"position":"bottom-left","width":90,"height":90},"description":"Adding heart decoration"},{"type":"search_images","payload":{"query":"flower","image_type":"illustration","count":1,"position":"bottom-right","width":100,"height":100},"description":"Adding flower decoration"}]}

User: (after wizard submission with data for BIRTHDAY like primaryText:"Happy Birthday Sarah", age:"30", includeDecorations:true)
{"message":"Creating a fun birthday invitation!","actions":[{"type":"apply_gradient_background","payload":{"colors":["#ff006e","#8338ec"],"direction":"vertical"},"description":"Setting vibrant gradient"},{"type":"add_text","payload":{"text":"Happy Birthday Sarah!","fontSize":64,"fontFamily":"Fredoka One","fill":"#ffffff","position":"top-center","fontWeight":"bold"},"description":"Adding birthday message"},{"type":"add_text","payload":{"text":"Turning 30!","fontSize":48,"fontFamily":"Quicksand","fill":"#ffbe0b","position":"center"},"description":"Adding age"},{"type":"add_text","payload":{"text":"June 15, 2024 • 7:00 PM","fontSize":20,"fontFamily":"Quicksand","fill":"#ffffff","position":"bottom-center"},"description":"Adding party details"},{"type":"search_images","payload":{"query":"balloon","image_type":"vector","count":1,"position":"top-left","width":120,"height":120},"description":"Adding balloon decoration"},{"type":"search_images","payload":{"query":"cake","image_type":"illustration","count":1,"position":"top-right","width":130,"height":130},"description":"Adding cake decoration"},{"type":"search_images","payload":{"query":"confetti","image_type":"vector","count":1,"position":"bottom-left","width":90,"height":90},"description":"Adding confetti"},{"type":"search_images","payload":{"query":"gift","image_type":"vector","count":1,"position":"bottom-right","width":100,"height":100},"description":"Adding gift decoration"},{"type":"search_images","payload":{"query":"party","image_type":"vector","count":1,"position":"middle-left","width":80,"height":80},"description":"Adding party decoration"}]}

User: (after wizard for GYM POSTER with includeImages:true, bold style)
{"message":"Creating a powerful gym poster!","actions":[{"type":"apply_gradient_background","payload":{"colors":["#000000","#1a1a1a","#ff0000"],"direction":"diagonal"},"description":"Setting bold gradient"},{"type":"add_text","payload":{"text":"TRANSFORM YOUR BODY","fontSize":72,"fontFamily":"Montserrat","fill":"#ffffff","position":"top-center","fontWeight":"900"},"description":"Adding main heading"},{"type":"add_text","payload":{"text":"Join Today & Get 50% Off","fontSize":32,"fontFamily":"Montserrat","fill":"#ff0000","position":"center","fontWeight":"bold"},"description":"Adding offer"},{"type":"search_images","payload":{"query":"fitness athlete","count":1,"position":"center","width":500,"height":350},"description":"Adding athlete image"},{"type":"search_images","payload":{"query":"dumbbell","image_type":"vector","count":1,"position":"top-left","width":100,"height":100},"description":"Adding dumbbell icon"},{"type":"search_images","payload":{"query":"barbell","image_type":"vector","count":1,"position":"top-right","width":100,"height":100},"description":"Adding barbell icon"},{"type":"search_images","payload":{"query":"muscle","image_type":"vector","count":1,"position":"bottom-left","width":90,"height":90},"description":"Adding muscle icon"},{"type":"search_images","payload":{"query":"trophy","image_type":"vector","count":1,"position":"bottom-right","width":90,"height":90},"description":"Adding trophy icon"}]}

User: (after wizard for EVENT/PARTY poster with decorations)
{"message":"Creating your event poster!","actions":[{"type":"apply_gradient_background","payload":{"colors":["#1a1a2e","#16213e","#0f3460"],"direction":"vertical"},"description":"Setting professional gradient"},{"type":"add_text","payload":{"text":"Annual Gala 2024","fontSize":68,"fontFamily":"Montserrat","fill":"#64ffda","position":"center","fontWeight":"bold"},"description":"Adding event name"},{"type":"add_text","payload":{"text":"An Evening to Remember","fontSize":28,"fontFamily":"Open Sans","fill":"#ccd6f6","position":"center"},"description":"Adding tagline"},{"type":"add_text","payload":{"text":"December 31, 2024 • 8:00 PM","fontSize":20,"fontFamily":"Open Sans","fill":"#8892b0","position":"bottom-center"},"description":"Adding event details"},{"type":"search_images","payload":{"query":"star","image_type":"vector","count":1,"position":"top-left","width":90,"height":90},"description":"Adding star decoration"},{"type":"search_images","payload":{"query":"confetti","image_type":"vector","count":1,"position":"top-right","width":100,"height":100},"description":"Adding confetti"},{"type":"search_images","payload":{"query":"ribbon","image_type":"vector","count":1,"position":"bottom-left","width":85,"height":85},"description":"Adding ribbon"},{"type":"search_images","payload":{"query":"celebration","image_type":"illustration","count":1,"position":"bottom-right","width":95,"height":95},"description":"Adding celebration decoration"}]}

User: "Add a red circle"
{"message":"I've added a red circle to the canvas.","actions":[{"type":"spawn_shape","payload":{"shapeType":"circle","options":{"fill":"#FF0000","position":"center","width":150,"height":150}},"description":"Red circle"}]}

User: "delete this [Referenced elements: @Heading (ID: \"txt_abc\", Type: textbox)]"
{"message":"Deleted the heading.","actions":[{"type":"delete_element","payload":{"elementQuery":"txt_abc"},"description":"Delete heading"}]}

User: "bring this to front [Referenced elements: @Image (ID: \"img_123\", Type: image)]"
{"message":"Brought the image to the front.","actions":[{"type":"bring_to_front","payload":{"elementQuery":"img_123"},"description":"Bring to front"}]}

User: "make the background a gradient from dark blue to purple"
{"message":"Applied a gradient background.","actions":[{"type":"apply_gradient_background","payload":{"colors":["#1a1a2e","#2d1b4e","#4a1d6e"],"direction":"vertical"},"description":"Gradient background"}]}

=== CRITICAL RULES ===
1. Output ONLY valid JSON - no markdown, no code blocks, no extra text
2. Always include "message" and "actions" keys
3. "actions" must be an array (empty [] if no canvas actions)
4. Apply color theory automatically (contrast text with background)
5. For design requests: search_templates → template_gallery/design_wizard → execute actions
6. Use referenced element IDs directly in elementQuery
7. When creating designs, use multiple actions: background, text, images, decorations
8. Position elements properly for professional layouts
9. Use appropriate fonts for the design type
${contextInfo ? `\nCANVAS: ${contextInfo.slice(0, 400)}` : ""}${historyContext ? `\nHISTORY: ${historyContext.slice(0, 150)}` : ""}`;
}

// parallel ai response - gemini+openrouter
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
          response: "Please add your API keys",
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
    ): {
      message?: string;
      actions?: unknown[];
      ui_component_request?: unknown;
    } | null => {
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
    ): {
      message: string;
      actions: unknown[];
      uiComponentRequest?: unknown;
    } => {
      console.log("[PARSE_RESPONSE_INPUT]", {
        textLength: text.length,
        textPreview: text.slice(0, 500),
        fullText: text,
      });

      let parsedMessage = text;
      let actions: unknown[] = [];
      let uiComponentRequest: unknown = undefined;

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
            hasUIComponent: !!parsed.ui_component_request,
            actions: JSON.stringify(parsed.actions || []).slice(0, 500),
          });
          if (parsed.message) parsedMessage = parsed.message;
          if (parsed.actions && Array.isArray(parsed.actions)) {
            actions = parsed.actions.map(normalizeAction);
          }
          if (parsed.ui_component_request) {
            uiComponentRequest = parsed.ui_component_request;
          }
          return { message: parsedMessage, actions, uiComponentRequest };
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
            hasUIComponent: !!parsed.ui_component_request,
          });
          if (parsed.message) parsedMessage = parsed.message;
          if (parsed.actions && Array.isArray(parsed.actions)) {
            actions = parsed.actions.map(normalizeAction);
          }
          if (parsed.ui_component_request) {
            uiComponentRequest = parsed.ui_component_request;
          }
          return { message: parsedMessage, actions, uiComponentRequest };
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
          if (parsed.ui_component_request) {
            uiComponentRequest = parsed.ui_component_request;
          }
          return { message: parsedMessage, actions, uiComponentRequest };
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
          if (parsed.ui_component_request) {
            uiComponentRequest = parsed.ui_component_request;
          }
          return { message: parsedMessage, actions, uiComponentRequest };
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

      return { message: parsedMessage, actions, uiComponentRequest };
    };

    // try gemini with first available key (fast)
    const userContentStr =
      typeof userContent === "string"
        ? userContent
        : JSON.stringify(userContent);

    console.log("[REST_MODE] AI request via REST endpoint (non-streaming)", {
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
        const { message, actions, uiComponentRequest } =
          parseResponse(responseText);

        console.log("[REST_MODE_COMPLETE]", {
          model: `gemini:${modelName}`,
          messagePreview: message.slice(0, 100),
          actionsCount: actions?.length || 0,
          hasUIComponent: !!uiComponentRequest,
          note: "Response delivered as single payload (not streamed)",
        });

        return c.json(
          success({
            response: message,
            isConfigured: true,
            actions,
            uiComponentRequest,
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
          const { message, actions, uiComponentRequest } =
            parseResponse(responseText);

          console.log("[AI_RESPONSE_FINAL]", {
            model: `openrouter:${modelName}`,
            messagePreview: message.slice(0, 100),
            actionsCount: actions.length,
            hasUIComponent: !!uiComponentRequest,
            actions: JSON.stringify(actions).slice(0, 500),
          });

          return c.json(
            success({
              response: message,
              isConfigured: true,
              actions,
              uiComponentRequest,
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
