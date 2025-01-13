import { prisma } from "~/lib/prisma";
import { Context } from "hono";
import { err, success } from "../utils/response";
import { userSchema } from "../schemas/user.schema";

export const getUsers = async (c: Context) => {
  try {
    const users = await prisma.user.findMany();
    return c.json(success(users));
  } catch (error) {
    return c.json(err("Failed to fetch users"), 500);
  }
};

export const createUser = async (c: Context) => {
  try {
    const body = await c.req.json();
    const result = userSchema.safeParse(body);

    if (!result.success) {
      return c.json(
        {
          success: false,
          error: result.error.errors,
        },
        400,
      );
    }

    const user = await prisma.user.create({
      data: result.data,
    });

    return c.json(success(user), 201);
  } catch (error) {
    return c.json(err("Failed to create user"), 500);
  }
};

export const deleteUser = async (c: Context) => {
  try {
    const id = c.req.param("id");
    const user = await prisma.user.delete({ where: { id } });
    return c.json(success(user));
  } catch (error) {
    return c.json(err("Failed to delete user"), 500);
  }
};
