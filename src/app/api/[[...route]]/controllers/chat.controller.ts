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

async function generateTitleWithAI(query: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return generateTitleFallback(query);
  }

  try {
    const { ChatGoogleGenerativeAI } = await import("@langchain/google-genai");

    const model = new ChatGoogleGenerativeAI({
      model: "gemini-1.5-flash",
      apiKey,
      temperature: 0.3,
      maxOutputTokens: 50,
    });

    const prompt = `Generate a very short, concise title (2-5 words max) for a design assistant conversation that starts with this message: "${query.slice(0, 200)}".

Rules:
- Maximum 5 words
- No quotes or punctuation at the end
- Be descriptive but brief
- Focus on the main topic/action

Respond with only the title, nothing else.`;

    const result = await model.invoke(prompt);
    const title = result.content
      .toString()
      .trim()
      .replace(/^["']|["']$/g, "")
      .slice(0, 50);

    return title || generateTitleFallback(query);
  } catch (error) {
    console.error("AI title generation failed:", error);
    return generateTitleFallback(query);
  }
}

// fallback title generation
function generateTitleFallback(query: string): string {
  const words = query.trim().split(/\s+/).slice(0, 6);
  let title = words.join(" ");
  if (title.length > 50) {
    title = title.slice(0, 47) + "...";
  }
  return title || "New Chat";
}

// get all conversations for user
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
        ...(projectId && { projectId }),
      },
      orderBy: { updatedAt: "desc" },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
          select: { content: true, role: true },
        },
        _count: { select: { messages: true } },
      },
    });

    const formatted = conversations.map((conv) => ({
      id: conv.id,
      title: conv.title,
      projectId: conv.projectId,
      createdAt: conv.createdAt.getTime(),
      updatedAt: conv.updatedAt.getTime(),
      messageCount: conv._count.messages,
      preview: conv.messages[0]?.content?.slice(0, 100),
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
        messages: conversation.messages.map((msg) => ({
          id: msg.id,
          role: msg.role.toLowerCase(),
          content: msg.content,
          actions: msg.actions,
          context: msg.context,
          timestamp: msg.createdAt.getTime(),
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

    await prisma.chatConversation.delete({ where: { id } });

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

// ai chat response schema
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
});

// generate ai response using gemini 2.5 flash
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

    const { message, context, conversationHistory } = result.data;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return c.json(
        success({
          response:
            "I'm here to help with your design! However, the AI service is not configured yet. Please add your GEMINI_API_KEY to enable full AI capabilities.",
          isConfigured: false,
        }),
      );
    }

    try {
      const { ChatGoogleGenerativeAI } =
        await import("@langchain/google-genai");

      const model = new ChatGoogleGenerativeAI({
        model: "gemini-2.5-flash",
        apiKey,
        temperature: 0.7,
        maxOutputTokens: 1024,
      });

      // build context string
      let contextInfo = "";
      if (context) {
        if (context.canvasSize) {
          contextInfo += `Canvas size: ${context.canvasSize.width}x${context.canvasSize.height}px. `;
        }
        if (context.backgroundColor) {
          contextInfo += `Background: ${context.backgroundColor}. `;
        }
        if (context.summary) {
          contextInfo += `Design summary: ${context.summary}. `;
        }
        if (context.elements && context.elements.length > 0) {
          const elementCount = context.elements.length;
          const textElements = context.elements.filter(
            (e) => e.type === "textbox" || e.type === "text",
          ).length;
          const imageElements = context.elements.filter(
            (e) => e.type === "image",
          ).length;
          const shapeElements = elementCount - textElements - imageElements;
          contextInfo += `Elements: ${elementCount} total (${textElements} text, ${imageElements} images, ${shapeElements} shapes). `;
        }
      }

      // build conversation history
      let historyContext = "";
      if (conversationHistory && conversationHistory.length > 0) {
        const recentHistory = conversationHistory.slice(-6);
        historyContext = recentHistory
          .map(
            (h) => `${h.role === "user" ? "User" : "Assistant"}: ${h.content}`,
          )
          .join("\n");
      }

      const systemPrompt = `You are a helpful design assistant for a canvas-based design editor called Arture. You help users with:
- Design suggestions and feedback
- Color scheme recommendations
- Layout and composition advice
- Typography guidance
- Creative ideas for their projects

Current design context:
${contextInfo || "No specific design context provided."}

${historyContext ? `Recent conversation:\n${historyContext}\n` : ""}

Important notes:
- Be concise and helpful
- Give practical, actionable suggestions
- If asked to edit the canvas directly, explain that direct editing is coming soon but you can guide them on how to make changes manually
- Be encouraging and supportive of their creative work
- Use simple, clear language

User message: ${message}`;

      const response = await model.invoke(systemPrompt);
      const responseText = response.content.toString().trim();

      return c.json(
        success({
          response: responseText,
          isConfigured: true,
        }),
      );
    } catch (aiError) {
      console.error("Gemini API error:", aiError);
      return c.json(
        success({
          response:
            "I encountered an issue processing your request. Please try again, or check if your GEMINI_API_KEY is valid.",
          isConfigured: true,
          error: true,
        }),
      );
    }
  } catch (error) {
    console.error("GenerateAIResponse error:", error);
    return c.json(err("Failed to generate AI response"), 500);
  }
};
