import { Router } from "express";
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import _ from "lodash";

import * as database from "../../database";
import * as helpers from "../../helpers";
import * as logic from "./logic";

const router = Router();

router.param("task_id", async function gettask(req, res, next, id) {
  const task: database.Task = await admin
    .firestore()
    .collection(database.COLLECTION_TASKS)
    .doc(id)
    .get()
    .then((s) => s.data() as any);
  if (!task) return res.status(404).json({ error: "task was not found" });

  res.locals.task = task;
  return next();
});

router.param("image_id", async function gettask(req, res, next, id) {
  const image: database.TaskImage = await admin
    .firestore()
    .collection(database.COLLECTION_TASK_IMAGES)
    .doc(id)
    .get()
    .then((s) => s.data() as any);
  if (!image) return res.status(404).json({ error: "image was not found" });

  res.locals.image = image;
  return next();
});

router.get("/", async function create(req, res) {
  const cursor = Number(req.query._cursor || "");
  const limit = Number(req.query._limit || "") || 10;

  const data = await admin
    .firestore()
    .collection(database.COLLECTION_TASKS)
    .orderBy("created_at", "asc")
    .startAfter(cursor)
    .limit(limit)
    .get()
    .then((snapshot) => {
      const tasks: database.TaskImage[] = [];
      snapshot.forEach((s) => tasks.push(s.data() as any));
      return tasks;
    });

  const next =
    data.length === limit ? Number(data[data.length - 1]?.created_at || 0) : 0;
  return res.json({ data, cursor: next });
});

router.get("/:task_id/images", async function create(req, res) {
  const task: database.Task = res.locals.task;
  const cursor = Number(req.query._cursor || "");
  const limit = Number(req.query._limit || "") || 10;

  const images = await admin
    .firestore()
    .collection(database.COLLECTION_TASK_IMAGES)
    .where("task_id", "==", task.id)
    .orderBy("created_at", "asc")
    .startAfter(cursor)
    .limit(limit)
    .get()
    .then((snapshot) => {
      const tasks: database.TaskImage[] = [];
      snapshot.forEach((s) => tasks.push(s.data() as any));
      return tasks;
    });

  const data = await Promise.all(
    images.map(async (image) => {
      const signedurl = await helpers.getsignedurl(image.key);
      return { ...image, image_url: signedurl.url };
    })
  );

  const next =
    data.length === limit ? Number(data[data.length - 1]?.created_at || 0) : 0;
  return res.json({ data, cursor: next });
});

router.get("/:task_id/images/:image_id", async function index(req, res) {
  const task: database.Task = res.locals.task;
  const image: database.TaskImage = res.locals.image;
  image.task = task;

  const signedurl = await helpers.getsignedurl(image.key);
  return res.json({ ...image, image_url: signedurl.url });
});

router.get("/:task_id/images/:image_id/next", async function index(req, res) {
  const task: database.Task = res.locals.task;
  const image: database.TaskImage = res.locals.image;

  const nextimage = await logic.next(task, image);
  if (!nextimage) return res.status(404).json({ error: "no more task image " });

  const prevsignedurl = await helpers.getsignedurl(image.key);
  const nextsignedurl = await helpers.getsignedurl(nextimage.key);
  return res.json({
    prev: { ...image, image_url: prevsignedurl.url },
    next: { ...nextimage, image_url: nextsignedurl.url },
  });
});

router.get("/:task_id/images/:image_id/prev", async function index(req, res) {
  const task: database.Task = res.locals.task;
  const image: database.TaskImage = res.locals.image;

  const previmage = await logic.prev(task, image);
  if (!previmage) return res.status(404).json({ error: "no more task image " });

  const prevsignedurl = await helpers.getsignedurl(previmage.key);
  const nextsignedurl = await helpers.getsignedurl(image.key);
  return res.json({
    prev: { ...previmage, image_url: prevsignedurl.url },
    next: { ...image, image_url: nextsignedurl.url },
  });
});

router.post(
  "/:task_id/images/:image_id/validation",
  async function index(req, res) {
    const user: database.User = res.locals.user;
    const task: database.Task = res.locals.task;
    const image: database.TaskImage = res.locals.image;
    if (image.tag_validated_at > 0) {
      return res.status(400).json({ error: "tag has been validated already" });
    }

    const dto: { tag: string } = req.body as any;
    if (!dto.tag) {
      return res.status(400).json({ error: "tag could not be blank" });
    }

    const update: Partial<database.TaskImage> = {
      tag: dto.tag,
      tag_validated_at: +new Date(),
      tag_validated_by: user.id,
    };

    const logkey = [task.id, image.id, user.id].join("/");
    const r = await admin
      .firestore()
      .collection(database.COLLECTION_TASK_IMAGES)
      .doc(image.id)
      .set(update, { merge: true })
      .catch((err) => functions.logger.error(`[${logkey}] ${err.message}`));
    if (!r) res.status(500).json({ error: "update was failed" });

    return res.json({ task_id: task.id, image_id: image.id, tag: dto.tag });
  }
);

export default router;
