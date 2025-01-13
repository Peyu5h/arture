import { Hono } from "hono";
import {
  getUsers,
  createUser,
  deleteUser,
} from "../controllers/users.controller";

const users = new Hono();

users.get("/", getUsers);

users.post("/", createUser);

users.delete("/:id", deleteUser);

export default users;
