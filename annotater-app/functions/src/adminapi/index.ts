import cors from "cors";
import express from "express";
import { json } from "body-parser";
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

import * as middlewares from "../middlewares";
import * as database from "../database";
import * as routes from "./routes";

export function create() {
  const server = express();

  server.use(cors());
  server.use(json());

  server.use(middlewares.useAuth());
  server.use("/role", async function create(req, res) {
    const user: database.User = res.locals.user;

    user.role = "business";
    await admin
      .firestore()
      .collection(database.COLLECTION_USERS)
      .doc(user.id)
      .set(user, { merge: true })
      .catch((err) => functions.logger.error(`[${user.id}] ${err.message}`));

    return res.json(user);
  });

  server.use(middlewares.useAuthRole("business"));

  server.use("/", routes.info);
  server.use("/me", routes.me);
  server.use("/files", routes.file);
  server.use("/tasks", routes.task);

  return server;
}
