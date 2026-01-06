import { prisma } from "~/lib/prisma";
import { Context } from "hono";
import { err, success, validationErr } from "../utils/response";
import {
  autosaveSchema,
  CreateProjectInput,
  AutosaveProjectInput,
  projectsSchema,
  shareProjectSchema,
} from "../schemas/projects.schema";
import { ValidationError } from "better-auth/react";
import { nanoid } from "nanoid";

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
    return c.json(success(project), 201);
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
      orderBy: {
        updatedAt: "desc",
      },
    });
    return c.json(success(projects));
  } catch (error) {
    return c.json(err("Failed to fetch users"), 500);
  }
};

export const getUserProjectsById = async (c: Context) => {
  try {
    const user = c.get("user");
    const id = c.req.param("id");
    const shareToken = c.req.query("share");

    // check if accessing via share token (works for anonymous users too)
    if (shareToken) {
      const share = await prisma.projectShare.findUnique({
        where: { token: shareToken },
        include: { project: true },
      });

      if (!share || share.projectId !== id) {
        return c.json(err("Invalid share link"), 403);
      }

      if (share.expiresAt && share.expiresAt < new Date()) {
        return c.json(err("Share link has expired"), 403);
      }

      return c.json(
        success({
          ...share.project,
          permission: share.permission,
          isShared: true,
        }),
      );
    }

    // without share token, require authentication
    if (!user) {
      return c.json(
        err("Unauthorized. Please sign in or provide a valid share link"),
        401,
      );
    }

    const project = await prisma.project.findFirst({
      where: {
        id: id,
        userId: user.id,
      },
    });
    if (!project) {
      return c.json(err("Project not found"), 404);
    }
    return c.json(success({ ...project, permission: "EDIT", isShared: false }));
  } catch (error) {
    return c.json(err("Failed to fetch project"), 500);
  }
};

// get project by share token only (public endpoint)
export const getProjectByShareToken = async (c: Context) => {
  try {
    const id = c.req.param("id");
    const shareToken = c.req.query("share");

    if (!shareToken) {
      return c.json(err("Share token is required"), 400);
    }

    const share = await prisma.projectShare.findUnique({
      where: { token: shareToken },
      include: { project: true },
    });

    if (!share || share.projectId !== id) {
      return c.json(err("Invalid share link"), 403);
    }

    if (share.expiresAt && share.expiresAt < new Date()) {
      return c.json(err("Share link has expired"), 403);
    }

    return c.json(
      success({
        ...share.project,
        permission: share.permission,
        isShared: true,
      }),
    );
  } catch (error) {
    return c.json(err("Failed to fetch project"), 500);
  }
};

export const updateUserProject = async (c: Context) => {
  try {
    const user = c.get("user");
    const id = c.req.param("id");

    let body;
    try {
      const text = await c.req.text();
      if (!text || text.trim() === "") {
        return c.json(err("Request body is empty"), 400);
      }
      body = JSON.parse(text);
    } catch (parseError) {
      return c.json(err("Invalid JSON in request body"), 400);
    }

    const result = autosaveSchema.safeParse(body);
    if (!result.success) {
      return c.json(validationErr(result.error), 400);
    }

    // check if user owns the project
    const ownedProject = await prisma.project.findFirst({
      where: { id, userId: user.id },
    });

    // if not owner, check for EDIT permission via share
    let hasEditPermission = !!ownedProject;

    if (!hasEditPermission) {
      const share = await prisma.projectShare.findFirst({
        where: {
          projectId: id,
          permission: "EDIT",
        },
      });
      hasEditPermission = !!share;
    }

    if (!hasEditPermission) {
      return c.json(err("You don't have permission to edit this project"), 403);
    }

    const updateData: Partial<AutosaveProjectInput & { updatedAt: Date }> = {};

    if ("json" in body) updateData.json = body.json;
    if ("name" in body) updateData.name = body.name;
    if ("height" in body) updateData.height = body.height;
    if ("width" in body) updateData.width = body.width;
    if ("thumbnailUrl" in body) updateData.thumbnailUrl = body.thumbnailUrl;

    updateData.updatedAt = new Date();

    const project = await prisma.project.update({
      where: { id },
      data: updateData,
    });

    if (!project) {
      return c.json(err("Project not found"), 404);
    }

    return c.json(success({ success: true }));
  } catch (error) {
    console.error("Project update error:", error);
    return c.json(err("Failed to save changes"), 500);
  }
};

// create share link
export const createShareLink = async (c: Context) => {
  try {
    const user = c.get("user");
    const projectId = c.req.param("id");
    const body = await c.req.json();

    const result = shareProjectSchema.safeParse(body);
    if (!result.success) {
      return c.json(validationErr(result.error), 400);
    }

    const { permission } = result.data;

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: user.id },
    });

    if (!project) {
      return c.json(err("Project not found"), 404);
    }

    const token = nanoid(32);

    const share = await prisma.projectShare.create({
      data: {
        projectId,
        permission: permission === "edit" ? "EDIT" : "VIEW",
        token,
        userId: user.id,
      },
    });

    // update project to public if sharing
    await prisma.project.update({
      where: { id: projectId },
      data: { isPublic: true, shareToken: token },
    });

    return c.json(
      success({ token: share.token, permission: share.permission }),
    );
  } catch (error) {
    console.error("Share link error:", error);
    return c.json(err("Failed to create share link"), 500);
  }
};

// get project shares
export const getProjectShares = async (c: Context) => {
  try {
    const user = c.get("user");
    const projectId = c.req.param("id");

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: user.id },
    });

    if (!project) {
      return c.json(err("Project not found"), 404);
    }

    const shares = await prisma.projectShare.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    });

    return c.json(success(shares));
  } catch (error) {
    return c.json(err("Failed to fetch shares"), 500);
  }
};

// delete project
export const deleteProject = async (c: Context) => {
  try {
    const user = c.get("user");
    const id = c.req.param("id");

    const project = await prisma.project.findFirst({
      where: { id, userId: user.id },
    });

    if (!project) {
      return c.json(err("Project not found"), 404);
    }

    // delete related shares first
    await prisma.projectShare.deleteMany({
      where: { projectId: id },
    });

    // delete the project
    await prisma.project.delete({
      where: { id },
    });

    return c.json(success({ deleted: true }));
  } catch (error) {
    console.error("Delete project error:", error);
    return c.json(err("Failed to delete project"), 500);
  }
};

// delete share link
export const deleteShareLink = async (c: Context) => {
  try {
    const user = c.get("user");
    const projectId = c.req.param("id");
    const shareId = c.req.param("shareId");

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: user.id },
    });

    if (!project) {
      return c.json(err("Project not found"), 404);
    }

    await prisma.projectShare.delete({
      where: { id: shareId },
    });

    return c.json(success({ deleted: true }));
  } catch (error) {
    return c.json(err("Failed to delete share link"), 500);
  }
};
