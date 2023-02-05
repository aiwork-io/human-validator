import cors from "cors";
import express from "express";
import { json } from "body-parser";

import * as middlewares from "../middlewares";
import * as routes from "./routes";

export function create() {
  const server = express();

  server.use(cors());
  server.use(json());

  server.use(middlewares.useAuth());
  server.use(middlewares.useAuthRole());

  server.use("/", routes.info);
  server.use("/me", routes.me);
  server.use("/tasks", routes.task);

  return server;
}
