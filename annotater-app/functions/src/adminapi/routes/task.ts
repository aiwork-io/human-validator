import path from "path";
import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import _ from "lodash";

import * as database from "../../database";
import * as helpers from "../../helpers";

const router = Router();

interface CreateReq {
  iteration_minimum_required: number;
  tags: string[];
}

router.post("/", async function create(req, res) {
  const user: database.User = res.locals.user;
  const dto: CreateReq = req.body as any;

  const minimumok =
    Number.isFinite(dto.iteration_minimum_required) &&
    dto.iteration_minimum_required > 0;
  if (!minimumok) {
    return res.status(400).json({ error: "iteration must greater than zero" });
  }

  const tagsok = Array.isArray(dto.tags) && dto.tags.length > 0;
  if (!tagsok) {
    return res.status(400).json({ error: "tags array could not be blank" });
  }

  const task: database.Task = {
    id: String(req.query.task_id || "") || uuidv4(),
    user_id: user.id,
    tags: dto.tags,
    iteration_minimum_required: dto.iteration_minimum_required,
    iteration_total: 0,
    iteration_remain: 0,
    unzip_at: +new Date(),
    validated_count: 0,
    created_at: +new Date(),
  };
  const err = await admin
    .firestore()
    .collection(database.COLLECTION_TASKS)
    .doc(task.id)
    .set(task, { merge: true })
    .then(() => null)
    .catch((err) => err);
  if (err) {
    functions.logger.error(`[${task.id}] ${err.message}`);
    return res.status(500).json({ error: "could not create new task" });
  }

  return res.json(task);
});

router.get("/", async function create(req, res) {
  const user: database.User = res.locals.user;
  const cursor = Number(req.query._cursor || "") || 0;
  const limit = Number(req.query._limit || "") || 100;

  const data = await admin
    .firestore()
    .collection(database.COLLECTION_TASKS)
    .orderBy("created_at")
    .where("user_id", "==", user.id)
    .startAfter(cursor)
    .limit(limit)
    .get()
    .then((snapshot) => {
      const tasks: database.Task[] = [];
      snapshot.forEach((s) => {
        const task: database.Task = s.data() as any;
        task.iteration_remain = Math.max(task.iteration_remain, 0);

        tasks.push(task);
      });
      return tasks;
    });

  const next =
    data.length === limit ? Number(data[data.length - 1]?.created_at || 0) : 0;
  return res.json({ data, cursor: next });
});

router.get("/:task_id/report", async function create(req, res) {
  const user: database.User = res.locals.user;
  const task: database.Task = await admin
    .firestore()
    .collection(database.COLLECTION_TASKS)
    .doc(req.params.task_id)
    .get()
    .then((s) => s.data() as any);

  if (task.user_id != user.id) {
    return res.status(404).json({ error: "task was not found or deleted" });
  }

  const images: database.TaskImage[] = await admin
    .firestore()
    .collection(database.COLLECTION_TASK_IMAGES)
    .where("task_id", "==", task.id)
    .get()
    .then((snapshot) => {
      const tasks: database.TaskImage[] = [];
      snapshot.forEach((s) => tasks.push(s.data() as any));
      return tasks;
    });
  if (!images.length) {
    return res.status(404).json({ error: "no report" });
  }

  const rows: string[] = [];
  for (const image of images) {
    const name = path.basename(image.key);
    const total = _.sum(Object.values(image.answer_hash));

    const row = [name, total];
    for (const tag of task.tags) {
      const percentage = Math.round(
        helpers.number((image.answer_hash[tag] * 100) / total)
      ).toFixed(2);
      row.push(`${tag} (${percentage}%)`);
    }
    rows.push(row.join(","));
  }

  res.setHeader("Content-Type", "text/csv;charset=utf-8");
  res.setHeader(
    "Content-disposition",
    `attachment;filename=report_${task.id}.csv`
  );

  const csv = rows.join("\n");
  return res.status(200).send(Buffer.from(csv, "utf-8"));
});

export default router;
