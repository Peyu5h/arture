import { z } from "zod";

export const aiChatSchema = z.object({
  message: z.string().min(1),
  context: z
    .object({
      elements: z.array(z.any()).optional(),
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
  canvasIndex: z.any().optional(),
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

export type AIChatInput = z.infer<typeof aiChatSchema>;
