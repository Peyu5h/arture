import { prisma } from "~/lib/prisma";
import { Context } from "hono";
import { err, success, validationErr } from "../utils/response";
import {
  createTemplateSchema,
  updateTemplateSchema,
} from "../schemas/templates.schema";

const ADMIN_EMAIL = "admin@gmail.com";

// check if user is admin
const isAdmin = (user: { email: string }) => user.email === ADMIN_EMAIL;

export const getTemplates = async (c: Context) => {
  try {
    const { q, category, trending } = c.req.query();

    const where: any = {};

    if (category && category !== "all") {
      where.category = category;
    }

    if (trending === "true") {
      where.isTrending = true;
    }

    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { tags: { hasSome: [q.toLowerCase()] } },
      ];
    }

    const orderBy: any[] = [];
    if (trending === "true") {
      orderBy.push({ displayOrder: "asc" });
    }
    orderBy.push({ createdAt: "desc" });

    const templates = await prisma.template.findMany({
      where,
      orderBy,
    });

    return c.json(success(templates));
  } catch (error) {
    console.error("Error fetching templates:", error);
    return c.json(err("Failed to fetch templates"), 500);
  }
};

export const getTemplateById = async (c: Context) => {
  try {
    const id = c.req.param("id");

    const template = await prisma.template.findUnique({
      where: { id },
    });

    if (!template) {
      return c.json(err("Template not found"), 404);
    }

    return c.json(success(template));
  } catch (error) {
    console.error("Error fetching template:", error);
    return c.json(err("Failed to fetch template"), 500);
  }
};

export const createTemplate = async (c: Context) => {
  try {
    const user = c.get("user");

    if (!isAdmin(user)) {
      return c.json(err("Unauthorized: Admin access required"), 403);
    }

    const result = createTemplateSchema.safeParse(await c.req.json());
    if (!result.success) {
      return c.json(validationErr(result.error), 400);
    }

    const { name, category, tags, json, thumbnailUrl, height, width } =
      result.data;

    const template = await prisma.template.create({
      data: {
        name,
        category,
        tags: tags.map((t) => t.toLowerCase()),
        json,
        thumbnailUrl,
        height,
        width,
        createdBy: user.id,
      },
    });

    return c.json(success(template), 201);
  } catch (error) {
    console.error("Error creating template:", error);
    return c.json(err("Failed to create template"), 500);
  }
};

export const updateTemplate = async (c: Context) => {
  try {
    const user = c.get("user");

    if (!isAdmin(user)) {
      return c.json(err("Unauthorized: Admin access required"), 403);
    }

    const id = c.req.param("id");
    const result = updateTemplateSchema.safeParse(await c.req.json());

    if (!result.success) {
      return c.json(validationErr(result.error), 400);
    }

    const template = await prisma.template.findUnique({
      where: { id },
    });

    if (!template) {
      return c.json(err("Template not found"), 404);
    }

    const updated = await prisma.template.update({
      where: { id },
      data: result.data,
    });

    return c.json(success(updated));
  } catch (error) {
    console.error("Error updating template:", error);
    return c.json(err("Failed to update template"), 500);
  }
};

export const deleteTemplate = async (c: Context) => {
  try {
    const user = c.get("user");

    if (!isAdmin(user)) {
      return c.json(err("Unauthorized: Admin access required"), 403);
    }

    const id = c.req.param("id");

    const template = await prisma.template.findUnique({
      where: { id },
    });

    if (!template) {
      return c.json(err("Template not found"), 404);
    }

    await prisma.template.delete({
      where: { id },
    });

    return c.json(success({ deleted: true }));
  } catch (error) {
    console.error("Error deleting template:", error);
    return c.json(err("Failed to delete template"), 500);
  }
};
