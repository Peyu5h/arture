import { prisma } from "~/lib/prisma";
import { Context } from "hono";
import { err, success, validationErr } from "../utils/response";
import {
  autosaveSchema,
  CreateProjectInput,
  projectsSchema,
} from "../schemas/projects.schema";
import { ValidationError } from "better-auth/react";

export const createProject = async (c: Context) => {
  try {
    const user = c.get("user");
    const result = projectsSchema.safeParse(await c.req.json());
    if (!result.success) {
      return c.json(validationErr(result.error), 400);
    }

    const { name, json, height, width } = result.data;
    const project = await prisma.project.create({
      data: {
        name,
        json,
        height,
        width,
        userId: user.id,
      },
    });
    return c.json(success({ project }), 201);
  } catch (error) {
    return c.json(err("Failed to fetch users"), 500);
  }
};

export const getUserProjects = async (c: Context) => {
  try {
    const user = c.get("user");
    const projects = await prisma.project.findMany({
      where: {
        userId: user.id,
      },
    });
    return c.json(success({ projects }));
  } catch (error) {
    return c.json(err("Failed to fetch users"), 500);
  }
};

export const getUserProjectsById = async (c: Context) => {
  try {
    const user = c.get("user");
    const id = c.req.param("id");
    const project = await prisma.project.findFirst({
      where: {
        id: id,
        userId: user.id,
      },
    });
    if (!project) {
      return c.json(err("Project not found"), 404);
    }
    return c.json(success({ project }));
  } catch (error) {
    return c.json(err("Failed to fetch users"), 500);
  }
};

export const updateUserProject = async (c: Context) => {
  try {
    const user = c.get("user");
    const id = c.req.param("id");
    const body = await c.req.json();
    const result = autosaveSchema.safeParse(body);
    if (!result.success) {
      return c.json(validationErr(result.error), 400);
    }

    const updateData: Partial<CreateProjectInput & { updatedAt: Date }> = {};

    if ("json" in body) updateData.json = body.json;
    if ("name" in body) updateData.name = body.name;
    if ("height" in body) updateData.height = body.height;
    if ("width" in body) updateData.width = body.width;

    updateData.updatedAt = new Date();

    const project = await prisma.project.update({
      where: { id, userId: user.id },
      data: updateData,
    });

    return c.json(success({ success: true }));
  } catch (error) {
    console.error("Project update error:", error);
    return c.json(err("Failed to save changes"), 500);
  }
};
