import { z } from "zod";

export const createConversationSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  projectId: z.string().optional(),
  context: z.any().optional(),
});

export const updateConversationSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  context: z.any().optional(),
});

export const createMessageSchema = z.object({
  conversationId: z.string().min(1),
  role: z.enum(["USER", "ASSISTANT", "SYSTEM"]),
  content: z.string().min(1),
  actions: z.any().optional(),
  context: z.any().optional(),
});

export const generateTitleSchema = z.object({
  query: z.string().min(1).max(500),
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type UpdateConversationInput = z.infer<typeof updateConversationSchema>;
export type CreateMessageInput = z.infer<typeof createMessageSchema>;
export type GenerateTitleInput = z.infer<typeof generateTitleSchema>;
