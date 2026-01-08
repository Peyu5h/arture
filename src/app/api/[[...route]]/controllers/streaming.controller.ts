import { Context } from "hono";
import { streamSSE } from "hono/streaming";
import { z } from "zod";
import { prisma } from "~/lib/prisma";
import { success, err, validationErr } from "../utils/response";
import {
  createParserState,
  processChunk,
  finalizeParser,
  type ParsedAction,
} from "~/lib/streaming/parser";
import {
  generateSessionId,
  generateEventId,
  formatSSEEvent,
  formatSSEHeartbeat,
  type StreamEvent,
  type SessionState,
} from "~/lib/streaming/session";

// gemini models
const GEMINI_MODELS = [
  "gemini-2.5-flash-preview-05-20",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
];

// openrouter models
const OPENROUTER_MODELS = [
  "google/gemini-2.0-flash-exp:free",
  "google/gemini-exp-1206:free",
];

const STREAM_TIMEOUT_MS = 120000;

// rate limit tracking
const rateLimitedKeys = new Map<string, number>();

function getGeminiApiKeys(): string[] {
  const keys: string[] = [];
  const primary = process.env.GEMINI_API_KEY;
  if (primary) keys.push(primary);
  for (let i = 1; i <= 5; i++) {
    const key = process.env[`GEMINI_API_KEY_${i}`];
    if (key) keys.push(key);
  }
  return keys;
}

function getOpenRouterApiKeys(): string[] {
  const keys: string[] = [];
  const primary = process.env.OPENROUTER_API_KEY;
  if (primary) keys.push(primary);
  for (let i = 1; i <= 3; i++) {
    const key = process.env[`OPENROUTER_API_KEY_${i}`];
    if (key) keys.push(key);
  }
  return keys;
}

function isRateLimitError(e: unknown): boolean {
  if (e instanceof Error) {
    const msg = e.message.toLowerCase();
    return msg.includes("rate") || msg.includes("quota") || msg.includes("429");
  }
  return false;
}

// session start schema
const startSessionSchema = z.object({
  conversationId: z.string().optional(),
  projectId: z.string().optional(),
});

// streaming request schema
const streamRequestSchema = z.object({
  sessionId: z.string(),
  message: z.string(),
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
      selectedElementIds: z.array(z.string()).optional(),
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

// builds system prompt for actions
function buildActionSystemPrompt(
  contextInfo: string,
  historyContext: string,
  imageContext: string,
): string {
  return `You are a canvas design assistant. Help users create and modify designs.

RESPONSE FORMAT - Always respond with valid JSON:
{
  "message": "Your helpful response here",
  "actions": [
    {
      "type": "action_type",
      "payload": { ... },
      "description": "What this action does"
    }
  ]
}

AVAILABLE ACTIONS:
- spawn_shape: Create shapes (payload: { shapeType, options: { fill, position, width, height } })
- add_text: Add text (payload: { text, fontSize, fontFamily, fill, position })
- move_element: Move element (payload: { elementQuery, position })
- modify_element: Change properties (payload: { elementQuery, properties: { fill, stroke, opacity, etc } })
- resize_element: Resize (payload: { elementQuery, width, height, scale })
- delete_element: Remove element (payload: { elementQuery })
- change_canvas_background: Change background (payload: { color })
- search_images: Find images (payload: { query, count })
- add_image_to_canvas: Add image (payload: { url, position })
- ask_clarification: Ask user question (payload: { question, options })

POSITIONS: "center", "top-left", "top-center", "top-right", "middle-left", "middle-right", "bottom-left", "bottom-center", "bottom-right"
SHAPES: "rectangle", "circle", "triangle", "diamond", "star", "hexagon"

${contextInfo ? `CANVAS STATE:\n${contextInfo}` : ""}
${historyContext ? `RECENT HISTORY:\n${historyContext}` : ""}
${imageContext ? `ATTACHED IMAGES:\n${imageContext}` : ""}

Be concise. Execute actions when clear. Ask for clarification when needed.`;
}

// start session endpoint
export const startSession = async (c: Context) => {
  try {
    const user = c.get("user");
    if (!user?.id) {
      return c.json(err("Unauthorized"), 401);
    }

    const body = await c.req.json();
    const result = startSessionSchema.safeParse(body);
    if (!result.success) {
      return c.json(validationErr(result.error), 400);
    }

    const { conversationId, projectId } = result.data;
    const sessionId = generateSessionId();

    // create session in database
    const session = await prisma.streamingSession.create({
      data: {
        id: sessionId,
        userId: user.id,
        conversationId,
        projectId,
        state: "CREATED",
      },
    });

    return c.json(
      success({
        sessionId: session.id,
        state: session.state,
        createdAt: session.startedAt,
      }),
    );
  } catch (error) {
    console.error("StartSession error:", error);
    return c.json(err("Failed to create session"), 500);
  }
};

// get session endpoint
export const getSession = async (c: Context) => {
  try {
    const user = c.get("user");
    if (!user?.id) {
      return c.json(err("Unauthorized"), 401);
    }

    const sessionId = c.req.param("id");
    if (!sessionId) {
      return c.json(err("Session ID required"), 400);
    }

    const session = await prisma.streamingSession.findUnique({
      where: { id: sessionId },
      include: {
        events: {
          orderBy: { sequence: "asc" },
          take: 100,
        },
        actions: {
          orderBy: { startedAt: "asc" },
        },
      },
    });

    if (!session) {
      return c.json(err("Session not found"), 404);
    }

    if (session.userId !== user.id) {
      return c.json(err("Unauthorized"), 403);
    }

    return c.json(
      success({
        id: session.id,
        state: session.state,
        currentMessage: session.currentMessage,
        events: session.events,
        actions: session.actions,
        error: session.error,
        startedAt: session.startedAt,
        completedAt: session.completedAt,
      }),
    );
  } catch (error) {
    console.error("GetSession error:", error);
    return c.json(err("Failed to get session"), 500);
  }
};

// streaming ai response with sse
export const streamAIResponse = async (c: Context) => {
  try {
    const user = c.get("user");
    if (!user?.id) {
      return c.json(err("Unauthorized"), 401);
    }

    const body = await c.req.json();
    const result = streamRequestSchema.safeParse(body);
    if (!result.success) {
      return c.json(validationErr(result.error), 400);
    }

    const {
      sessionId,
      message,
      context,
      conversationHistory,
      imageAttachments,
    } = result.data;

    console.log("[STREAMING_MODE] SSE stream request received", {
      sessionId,
      messagePreview: message.slice(0, 80),
      hasContext: !!context,
      historyLength: conversationHistory?.length || 0,
    });

    // verify session exists
    const session = await prisma.streamingSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.userId !== user.id) {
      return c.json(err("Invalid session"), 400);
    }

    // update session state
    await prisma.streamingSession.update({
      where: { id: sessionId },
      data: { state: "CONNECTING", lastActivityAt: new Date() },
    });

    // build context
    let contextInfo = "";
    if (context) {
      if (context.canvasSize) {
        contextInfo += `Canvas: ${context.canvasSize.width}x${context.canvasSize.height}px. `;
      }
      if (context.backgroundColor) {
        contextInfo += `Background: ${context.backgroundColor}. `;
      }
      if (context.selectedElementIds?.length) {
        contextInfo += `SELECTED: ${context.selectedElementIds.join(",")}. `;
      }
      if (context.elements?.length) {
        const elements = context.elements.slice(0, 8).map((e) => {
          const type = String(e.type || "?");
          const sel = e.isSelected ? "*" : "";
          return `${type}${sel}`;
        });
        contextInfo += `Elements: ${elements.join(", ")}. `;
      }
    }

    let imageContext = "";
    if (imageAttachments?.length) {
      imageContext = imageAttachments
        .map((img, i) => {
          const url = img.cloudinaryUrl || img.dataUrl?.slice(0, 50) + "...";
          return `${i + 1}. ${img.name}: ${url}`;
        })
        .join("\n");
    }

    let historyContext = "";
    if (conversationHistory?.length) {
      const recent = conversationHistory.slice(-6);
      historyContext = recent
        .map((h) => `${h.role === "user" ? "User" : "Assistant"}: ${h.content}`)
        .join("\n");
    }

    const systemPrompt = buildActionSystemPrompt(
      contextInfo,
      historyContext,
      imageContext,
    );

    return streamSSE(c, async (stream) => {
      let eventSequence = 0;
      const parserState = createParserState();
      let modelUsed = "";
      let streamSuccess = false;

      const sendEvent = async (
        type: string,
        data: unknown,
      ): Promise<StreamEvent> => {
        const event: StreamEvent = {
          id: generateEventId(),
          type: type as StreamEvent["type"],
          sessionId,
          timestamp: Date.now(),
          data,
          sequence: eventSequence++,
        };

        await stream.writeSSE({
          event: type,
          data: JSON.stringify({
            type: event.type,
            id: event.id,
            sequence: event.sequence,
            timestamp: event.timestamp,
            data: event.data,
          }),
          id: event.id,
        });

        // persist event
        await prisma.streamingEvent
          .create({
            data: {
              id: event.id,
              sessionId,
              type: type.toUpperCase().replace("-", "_") as any,
              sequence: event.sequence,
              data: event.data as any,
            },
          })
          .catch(console.error);

        return event;
      };

      const sendAction = async (action: ParsedAction) => {
        await sendEvent("action", action);

        // persist action
        await prisma.sessionAction
          .create({
            data: {
              sessionId,
              type: action.type,
              payload: action.payload as any,
              description: action.description,
              status: "PENDING",
            },
          })
          .catch(console.error);
      };

      try {
        // send session start
        await sendEvent("session_start", { sessionId, timestamp: Date.now() });

        await prisma.streamingSession.update({
          where: { id: sessionId },
          data: { state: "STREAMING", lastActivityAt: new Date() },
        });

        console.log("[STREAMING_MODE] Starting SSE stream to client");

        // try gemini streaming first
        const geminiKeys = getGeminiApiKeys();
        for (const apiKey of geminiKeys) {
          if (rateLimitedKeys.has(apiKey)) {
            const expiry = rateLimitedKeys.get(apiKey)!;
            if (Date.now() < expiry) continue;
            rateLimitedKeys.delete(apiKey);
          }

          for (const modelName of GEMINI_MODELS) {
            try {
              const controller = new AbortController();
              const timeoutId = setTimeout(
                () => controller.abort(),
                STREAM_TIMEOUT_MS,
              );

              const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:streamGenerateContent?key=${apiKey}&alt=sse`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    contents: [
                      { role: "user", parts: [{ text: systemPrompt }] },
                      {
                        role: "model",
                        parts: [
                          {
                            text: "I understand. I will respond with valid JSON containing message and actions.",
                          },
                        ],
                      },
                      { role: "user", parts: [{ text: message }] },
                    ],
                    generationConfig: {
                      temperature: 0.7,
                      maxOutputTokens: 4096,
                      responseMimeType: "application/json",
                    },
                  }),
                  signal: controller.signal,
                },
              );

              clearTimeout(timeoutId);

              if (!response.ok) {
                const errorText = await response.text();
                if (
                  errorText.includes("rate") ||
                  errorText.includes("quota") ||
                  response.status === 429
                ) {
                  rateLimitedKeys.set(apiKey, Date.now() + 60000);
                }
                continue;
              }

              modelUsed = `gemini:${modelName}`;
              const reader = response.body?.getReader();
              if (!reader) continue;

              const decoder = new TextDecoder();
              let buffer = "";

              while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() || "";

                for (const line of lines) {
                  if (!line.startsWith("data: ")) continue;
                  const data = line.slice(6);
                  if (data === "[DONE]") continue;

                  try {
                    const parsed = JSON.parse(data);
                    const text =
                      parsed.candidates?.[0]?.content?.parts?.[0]?.text || "";

                    if (text) {
                      // send raw chunk
                      console.log("[STREAMING_CHUNK]", {
                        length: text.length,
                        preview: text.slice(0, 50),
                      });
                      await sendEvent("chunk", { text });

                      // process with incremental parser
                      const { newActions, newMessage } = processChunk(
                        parserState,
                        text,
                      );

                      // send new message content
                      if (newMessage) {
                        await sendEvent("message", {
                          content: newMessage,
                          isPartial: true,
                          role: "assistant",
                        });
                      }

                      // send new actions
                      for (const action of newActions) {
                        console.log("[STREAMING_ACTION]", {
                          type: action.type,
                          description: action.description,
                        });
                        await sendAction(action);
                      }
                    }
                  } catch {
                    // skip malformed chunks
                  }
                }
              }

              // finalize parsing
              const finalResult = finalizeParser(parserState);

              // send complete message
              await sendEvent("message", {
                content: finalResult.message,
                isPartial: false,
                role: "assistant",
              });

              // send any remaining actions
              if (finalResult.actions) {
                for (const action of finalResult.actions) {
                  if (
                    !parserState.extractedActions.find(
                      (a) => a.id === action.id,
                    )
                  ) {
                    await sendAction(action);
                  }
                }
              }

              streamSuccess = true;
              break;
            } catch (e) {
              if (isRateLimitError(e)) {
                rateLimitedKeys.set(apiKey, Date.now() + 60000);
              }
              continue;
            }
          }
          if (streamSuccess) break;
        }

        // fallback to openrouter if gemini failed
        if (!streamSuccess) {
          const openRouterKeys = getOpenRouterApiKeys();
          for (const apiKey of openRouterKeys) {
            for (const modelName of OPENROUTER_MODELS) {
              try {
                const controller = new AbortController();
                const timeoutId = setTimeout(
                  () => controller.abort(),
                  STREAM_TIMEOUT_MS,
                );

                const response = await fetch(
                  "https://openrouter.ai/api/v1/chat/completions",
                  {
                    method: "POST",
                    headers: {
                      Authorization: `Bearer ${apiKey}`,
                      "Content-Type": "application/json",
                      "HTTP-Referer":
                        process.env.NEXT_PUBLIC_APP_URL ||
                        "http://localhost:3000",
                      "X-Title": "Arture Canvas",
                    },
                    body: JSON.stringify({
                      model: modelName,
                      messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: message },
                      ],
                      max_tokens: 4096,
                      temperature: 0.7,
                      stream: true,
                    }),
                    signal: controller.signal,
                  },
                );

                clearTimeout(timeoutId);

                if (!response.ok) continue;

                modelUsed = `openrouter:${modelName}`;
                const reader = response.body?.getReader();
                if (!reader) continue;

                const decoder = new TextDecoder();
                let buffer = "";

                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;

                  buffer += decoder.decode(value, { stream: true });
                  const lines = buffer.split("\n");
                  buffer = lines.pop() || "";

                  for (const line of lines) {
                    if (!line.startsWith("data: ")) continue;
                    const data = line.slice(6);
                    if (data === "[DONE]") continue;

                    try {
                      const parsed = JSON.parse(data);
                      const text = parsed.choices?.[0]?.delta?.content || "";

                      if (text) {
                        await sendEvent("chunk", { text });

                        const { newActions, newMessage } = processChunk(
                          parserState,
                          text,
                        );

                        if (newMessage) {
                          await sendEvent("message", {
                            content: newMessage,
                            isPartial: true,
                            role: "assistant",
                          });
                        }

                        for (const action of newActions) {
                          await sendAction(action);
                        }
                      }
                    } catch {
                      // skip malformed chunks
                    }
                  }
                }

                const finalResult = finalizeParser(parserState);

                await sendEvent("message", {
                  content: finalResult.message,
                  isPartial: false,
                  role: "assistant",
                });

                if (finalResult.actions) {
                  for (const action of finalResult.actions) {
                    if (
                      !parserState.extractedActions.find(
                        (a) => a.id === action.id,
                      )
                    ) {
                      await sendAction(action);
                    }
                  }
                }

                streamSuccess = true;
                break;
              } catch {
                continue;
              }
            }
            if (streamSuccess) break;
          }
        }

        // send complete event
        console.log("[STREAMING_COMPLETE]", {
          success: streamSuccess,
          model: modelUsed,
          actionsCount: parserState.extractedActions.length,
          messageLength: parserState.extractedMessage.length,
        });
        await sendEvent("complete", {
          success: streamSuccess,
          model: modelUsed,
          actionsCount: parserState.extractedActions.length,
        });

        // update session
        await prisma.streamingSession.update({
          where: { id: sessionId },
          data: {
            state: streamSuccess ? "COMPLETED" : "ERROR",
            model: modelUsed || null,
            currentMessage: parserState.extractedMessage,
            completedAt: new Date(),
            lastActivityAt: new Date(),
            error: streamSuccess ? null : "All providers failed",
          },
        });
      } catch (error) {
        console.error("Stream error:", error);
        await sendEvent("error", {
          message: error instanceof Error ? error.message : "Streaming failed",
        });

        await prisma.streamingSession.update({
          where: { id: sessionId },
          data: {
            state: "ERROR",
            error: error instanceof Error ? error.message : "Unknown error",
            lastActivityAt: new Date(),
          },
        });
      }
    });
  } catch (error) {
    console.error("StreamAIResponse error:", error);
    return c.json(err("Failed to start streaming"), 500);
  }
};

// get session events (for recovery after refresh)
export const getSessionEvents = async (c: Context) => {
  try {
    const user = c.get("user");
    if (!user?.id) {
      return c.json(err("Unauthorized"), 401);
    }

    const sessionId = c.req.param("id");
    const sinceSequence = parseInt(c.req.query("since") || "0");

    if (!sessionId) {
      return c.json(err("Session ID required"), 400);
    }

    const session = await prisma.streamingSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.userId !== user.id) {
      return c.json(err("Session not found"), 404);
    }

    const events = await prisma.streamingEvent.findMany({
      where: {
        sessionId,
        sequence: { gt: sinceSequence },
      },
      orderBy: { sequence: "asc" },
      take: 100,
    });

    const actions = await prisma.sessionAction.findMany({
      where: { sessionId },
      orderBy: { startedAt: "asc" },
    });

    return c.json(
      success({
        sessionId,
        state: session.state,
        events,
        actions,
        currentMessage: session.currentMessage,
      }),
    );
  } catch (error) {
    console.error("GetSessionEvents error:", error);
    return c.json(err("Failed to get events"), 500);
  }
};

// health check endpoint
export const healthCheck = async (c: Context) => {
  const geminiKeys = getGeminiApiKeys();
  const openRouterKeys = getOpenRouterApiKeys();

  return c.json(
    success({
      status: "healthy",
      providers: {
        gemini: {
          configured: geminiKeys.length > 0,
          keyCount: geminiKeys.length,
        },
        openRouter: {
          configured: openRouterKeys.length > 0,
          keyCount: openRouterKeys.length,
        },
      },
      timestamp: Date.now(),
    }),
  );
};
