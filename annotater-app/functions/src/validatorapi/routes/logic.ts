import * as admin from "firebase-admin";

import * as database from "../../database";

export async function next(task: database.Task, img: database.TaskImage) {
  const images = await admin
    .firestore()
    .collection(database.COLLECTION_TASK_IMAGES)
    .where("task_id", "==", task.id)
    .where("created_at", ">=", img.created_at)
    .orderBy("created_at", "asc")
    .limit(5)
    .get()
    .then((snapshot) => {
      const tasks: database.TaskImage[] = [];
      snapshot.forEach((s) => tasks.push(s.data() as any));
      return tasks;
    });
  if (!images.length) return null;

  for (const image of images) {
    if (image.id !== img.id) return image;
  }

  return null;
}

export async function prev(task: database.Task, img: database.TaskImage) {
  const images = await admin
    .firestore()
    .collection(database.COLLECTION_TASK_IMAGES)
    .where("task_id", "==", task.id)
    .where("created_at", "<=", img.created_at)
    .orderBy("created_at", "desc")
    .limit(5)
    .get()
    .then((snapshot) => {
      const tasks: database.TaskImage[] = [];
      snapshot.forEach((s) => tasks.push(s.data() as any));
      return tasks;
    });
  if (!images.length) return null;

  for (const image of images) {
    if (image.id !== img.id) return image;
  }

  return null;
}
