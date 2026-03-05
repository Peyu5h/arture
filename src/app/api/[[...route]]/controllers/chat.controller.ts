import { Context } from "hono";

import {
  createConversationSchema,
  updateConversationSchema,
  createMessageSchema,
  generateTitleSchema,
} from "../schemas/chat.schema";
import { err, success, validationErr } from "../utils/response";
import { prisma } from "~/lib/prisma";
import { callLLM, callLLMSimple } from "~/lib/llm";
import { buildSystemPrompt, buildContextInfo } from "~/lib/ai/prompts";
import { parseAIResponse } from "~/lib/ai/response-parser";
import { aiChatSchema, type AIChatInput } from "../schemas/ai-chat.schema";

// title generation

async function generateTitleWithAI(content: string): Promise<string> {
  try {
    const prompt = `Generate a short title (3-5 words) for this message. Return ONLY the title, no quotes or punctuation:\n"${content.slice(0, 200)}"`;
    const text = await callLLMSimple("title_generation", prompt);
    const title = text.replace(/["']/g, "").trim().slice(0, 50);
    return title || generateTitleFallback(content);
  } catch {
    return generateTitleFallback(content);
  }
}

function generateTitleFallback(content: string): string {
  const words = content.split(/\s+/).slice(0, 5);
  let title = words.join(" ");
  if (title.length > 50) title = title.slice(0, 47) + "...";
  return title || "New Chat";
}

// conversations crud

export const getConversations = async (c: Context) => {
  try {
    const user = c.get("user");
    if (!user?.id) return c.json(err("Unauthorized"), 401);

    const projectId = c.req.query("projectId");

    const conversations = await prisma.chatConversation.findMany({
      where: {
        userId: user.id,
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

export const getConversation = async (c: Context) => {
  try {
    const user = c.get("user");
    if (!user?.id) return c.json(err("Unauthorized"), 401);

    const id = c.req.param("id");

    const conversation = await prisma.chatConversation.findFirst({
      where: { id, userId: user.id },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!conversation) return c.json(err("Conversation not found"), 404);

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
    if (!user?.id) return c.json(err("Unauthorized"), 401);

    const body = await c.req.json();
    const result = createConversationSchema.safeParse(body);
    if (!result.success) return c.json(validationErr(result.error), 400);

    const { title, projectId, context } = result.data;

    const conversation = await prisma.chatConversation.create({
      data: {
        title: title || "New Chat",
        userId: user.id,
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
    if (!user?.id) return c.json(err("Unauthorized"), 401);

    const id = c.req.param("id");
    const body = await c.req.json();
    const result = updateConversationSchema.safeParse(body);
    if (!result.success) return c.json(validationErr(result.error), 400);

    const existing = await prisma.chatConversation.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) return c.json(err("Conversation not found"), 404);

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
    if (!user?.id) return c.json(err("Unauthorized"), 401);

    const id = c.req.param("id");

    const existing = await prisma.chatConversation.findFirst({
      where: { id, userId: user.id },
    });
    if (!existing) return c.json(err("Conversation not found"), 404);

    await prisma.chatConversation.delete({ where: { id } });

    return c.json(success({ deleted: true }));
  } catch (error) {
    console.error("DeleteConversation error:", error);
    return c.json(err("Failed to delete conversation"), 500);
  }
};

// messages

export const createMessage = async (c: Context) => {
  try {
    const user = c.get("user");
    if (!user?.id) return c.json(err("Unauthorized"), 401);

    const body = await c.req.json();
    const result = createMessageSchema.safeParse(body);
    if (!result.success) return c.json(validationErr(result.error), 400);

    const { conversationId, role, content, actions, context } = result.data;

    const conversation = await prisma.chatConversation.findFirst({
      where: { id: conversationId, userId: user.id },
    });
    if (!conversation) return c.json(err("Conversation not found"), 404);

    const message = await prisma.chatMessage.create({
      data: { conversationId, role, content, actions, context },
    });

    // auto-generate title on first user message
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

export const generateTitle = async (c: Context) => {
  try {
    const body = await c.req.json();
    const result = generateTitleSchema.safeParse(body);
    if (!result.success) return c.json(validationErr(result.error), 400);

    const title = await generateTitleWithAI(result.data.query);
    return c.json(success({ title }));
  } catch (error) {
    console.error("GenerateTitle error:", error);
    return c.json(err("Failed to generate title"), 500);
  }
};

// ai response generation

export const generateAIResponse = async (c: Context) => {
  try {
    const user = c.get("user");
    if (!user?.id) return c.json(err("Unauthorized"), 401);

    const body = await c.req.json();
    const result = aiChatSchema.safeParse(body);
    if (!result.success) return c.json(validationErr(result.error), 400);

    const { message, context, conversationHistory, imageAttachments } =
      result.data;

    const contextInfo = buildContextInfo(
      context,
      conversationHistory,
      imageAttachments?.length,
    );
    const systemPrompt = buildSystemPrompt(contextInfo);

    console.log("[AI_REQUEST]", {
      message: message.slice(0, 100),
      contextLength: contextInfo.length,
    });

    // call llm with automatic provider fallback
    let llmResponse;
    try {
      llmResponse = await callLLM("chat", systemPrompt, message);
    } catch (e: any) {
      const code = e.code || "UNKNOWN";
      const errorMessages: Record<string, string> = {
        RATE_LIMITED:
          "I'm receiving too many requests right now. Please wait a moment and try again.",
        TIMEOUT:
          "The request took too long. Please try a simpler request or try again.",
        NOT_CONFIGURED:
          "No AI provider is configured. Please add GEMINI_API_KEY, GROQ_API_KEY, or Cloudflare credentials to your environment.",
        API_ERROR:
          "There was an issue with the AI service. Please try again shortly.",
      };

      return c.json(
        success({
          response:
            errorMessages[code] ||
            "I couldn't process your request. Please try again.",
          isConfigured: code !== "NOT_CONFIGURED",
          error: true,
          errorCode: code,
          actions: [],
        }),
      );
    }

    const {
      message: aiMessage,
      actions,
      uiComponentRequest,
    } = parseAIResponse(llmResponse.text);

    console.log("[AI_RESPONSE]", {
      provider: llmResponse.provider,
      model: llmResponse.model,
      latencyMs: llmResponse.latencyMs,
      actionsCount: actions.length,
    });

    return c.json(
      success({
        response: aiMessage,
        isConfigured: true,
        actions,
        uiComponentRequest,
        model: llmResponse.model,
        provider: llmResponse.provider,
      }),
    );
  } catch (error) {
    console.error("GenerateAIResponse error:", error);
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    return c.json(
      success({
        response: `Something went wrong: ${errorMsg.slice(0, 100)}. Please try again.`,
        isConfigured: true,
        error: true,
        errorCode: "INTERNAL_ERROR",
        actions: [],
      }),
    );
  }
};
