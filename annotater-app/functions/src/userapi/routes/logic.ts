import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { v4 as uuidv4 } from "uuid";
import _ from "lodash";
import { RequestHandler } from "express";
import { ParamsDictionary } from "express-serve-static-core";
import { ParsedQs } from "qs";

import * as database from "../../database";
import * as helpers from "../../helpers";

export const TAG_SAMPLE_SIZE = 4;

export async function sync(
  uid: string
): Promise<{ count: number; utasks: any[] }> {
  const usertasks = await admin
    .firestore()
    .collection(database.COLLECTION_USER_TASKS)
    .where("user_id", "==", uid)
    .get()
    .then((snapshot) => {
      const tasks: database.UserTask[] = [];
      snapshot.forEach((s) => tasks.push(s.data() as any));
      return tasks;
    });
  const utaskids = usertasks.map((t) => t.task_id);
  functions.logger.info(`[${uid}] found tasks ${utaskids}`);

  const tasks: database.Task[] = [];
  if (usertasks.length) {
    await admin
      .firestore()
      .collection(database.COLLECTION_TASKS)
      .where("id", "not-in", utaskids)
      .get()
      .then((snapshot) => snapshot.forEach((s) => tasks.push(s.data() as any)))
      .catch((err) => functions.logger.error(`[${uid}] ${err.message}`));
  } else {
    await admin
      .firestore()
      .collection(database.COLLECTION_TASKS)
      .get()
      .then((snapshot) => snapshot.forEach((s) => tasks.push(s.data() as any)))
      .catch((err) => functions.logger.error(`[${uid}] ${err.message}`));
  }
  if (!tasks.length) {
    functions.logger.error(`[${uid}] no tasks was found`);
    return { count: 0, utasks: [] };
  }

  let icount = 0;
  const utasks: database.UserTask[] = [];
  for (const task of tasks) {
    if (!task.tags?.length) {
      functions.logger.error(`[${task.id}] not tags`);
      continue;
    }

    const batch = admin.firestore().batch();

    const images = await admin
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
      functions.logger.error(`[${uid}/${task.id}] no images`);
      continue;
    }

    icount += images.length;
    const utask: database.UserTask = {
      id: uuidv4(),
      user_id: uid,
      task_id: task.id,
      uncompleted_task_image_ids: _.shuffle(images.map((t) => t.id)),
      completed_task_image_ids: [],
      completed_at: 0,
    };
    utasks.push(utask);
    const ref = admin
      .firestore()
      .collection(database.COLLECTION_USER_TASKS)
      .doc(utask.id);
    batch.set(ref, utask, { merge: true });
    await batch.commit();
  }

  return { count: icount, utasks };
}

export async function getQuestion(
  utask: database.UserTask,
  task: database.Task
): Promise<{ status: number; data: any }> {
  const id = _.first(
    _.difference(
      utask.uncompleted_task_image_ids,
      utask.completed_task_image_ids
    )
  );
  if (!id) {
    return { status: 400, data: { error: "no more task" } };
  }

  const image: database.TaskImage = await admin
    .firestore()
    .collection(database.COLLECTION_TASK_IMAGES)
    .doc(id)
    .get()
    .then((s) => s.data() as any)
    .catch((err) => functions.logger.error(`[${id}] ${err.message}`));
  if (!image) {
    return { status: 400, data: { error: "task image was not found" } };
  }

  const signedurl = await helpers.getsignedurl(image.key);
  if (signedurl.error) {
    return { status: 400, data: { error: "could not get image url" } };
  }

  const data = {
    utask,
    task_image_id: image.id,
    image_url: signedurl.url,
    tags: task.tags,
  };

  return { status: 200, data };
}

export function useTask(): RequestHandler<
  ParamsDictionary,
  any,
  any,
  ParsedQs,
  any
> {
  return async (req, res, next) => {
    const user: database.User = res.locals.user;
    const utaskid = req.body.utask_id;
    if (!utaskid) {
      return res.status(404).json({ error: "user task id could not be blank" });
    }

    res.locals.utask = await admin
      .firestore()
      .collection(database.COLLECTION_USER_TASKS)
      .doc(utaskid)
      .get()
      .then((s) => s.data() as any);
    if (res.locals.utask?.user_id != user.id) {
      return res.status(404).json({ error: "user task was not found" });
    }

    res.locals.task = await admin
      .firestore()
      .collection(database.COLLECTION_TASKS)
      .doc(res.locals.utask.task_id)
      .get()
      .then((s) => s.data() as any);
    if (!res.locals.task) {
      return res.status(404).json({ error: "original task was not found" });
    }

    return next();
  };
}
