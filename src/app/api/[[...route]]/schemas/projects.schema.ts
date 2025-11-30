import { z } from "zod";

export const projectsSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  json: z.any(),
  height: z.number().int().positive(),
  width: z.number().int().positive(),
});

export const autosaveSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
    json: z.any().optional(),
    height: z.number().int().positive().optional(),
    width: z.number().int().positive().optional(),
    thumbnailUrl: z.string().optional(),
  })
  .refine(
    (data) => {
      return Object.keys(data).length > 0;
    },
    {
      message: "At least one field must be provided for update",
    },
  );

export type CreateProjectInput = z.infer<typeof projectsSchema>;

export type AutosaveProjectInput = z.infer<typeof autosaveSchema>;
