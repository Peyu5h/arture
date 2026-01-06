import { z } from "zod";

export const createTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  category: z.enum(["resume", "poster", "events", "cards", "invitations"]),
  tags: z.array(z.string()).default([]),
  json: z.any(),
  thumbnailUrl: z.string().optional(),
  height: z.number().int().positive(),
  width: z.number().int().positive(),
});

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;

export const searchTemplatesSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
});

export type SearchTemplatesInput = z.infer<typeof searchTemplatesSchema>;

export const updateTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  category: z
    .enum(["resume", "poster", "events", "cards", "invitations"])
    .optional(),
  tags: z.array(z.string()).optional(),
  json: z.any().optional(),
  thumbnailUrl: z.string().optional(),
  height: z.number().int().positive().optional(),
  width: z.number().int().positive().optional(),
  isTrending: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
});

export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
