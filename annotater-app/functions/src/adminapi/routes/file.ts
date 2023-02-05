import path from "path";
import { Router } from "express";
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { v4 as uuidv4 } from "uuid";

import * as constants from "../../constants";
import * as database from "../../database";
import * as helpers from "../../helpers";

const router = Router();

router.get("/upload/zip", async function index(req, res) {
  const filename = `${uuidv4()}.zip`;
  const filekey = path.join(constants.FOLDER_TASK_ZIP, filename);
  const [signedUrl] = await admin
    .storage()
    .bucket()
    .file(filekey)
    .getSignedUrl({
      version: "v4",
      action: "write",
      expires: Date.now() + 60 * 60 * 1000, // 1 hour
      contentType: "application/zip",
    })
    .catch((error) => {
      functions.logger.error(error);
      return [];
    });

  if (!signedUrl) {
    return res.status(500).json({ error: "Oops!! Something went wrong!" });
  }

  return res.json({ key: filekey, url: signedUrl });
});

router.get("/upload/png", async function index(req, res) {
  const user: database.User = res.locals.user;
  const contentType = req.query.content_type as string;
  if (!contentType) {
    return res
      .status(400)
      .json({ error: "file content type could not be blank" });
  }

  const taskid = req.query.task_id as string;
  if (!taskid) {
    return res.status(400).json({ error: "task id could not be blank" });
  }
  const task: database.Task = await admin
    .firestore()
    .collection(database.COLLECTION_TASKS)
    .doc(taskid)
    .get()
    .then((s) => s.data() as any);
  if (!task) {
    return res.status(400).json({ error: "task was not found" });
  }

  const filename = req.query.filename as string;
  if (!filename) {
    return res.status(400).json({ error: "filename could not be blank" });
  }

  const image: database.TaskImage = {
    id: uuidv4(),
    user_id: user.id,
    task_id: taskid,
    key: path.join(constants.FOLDER_TASK_IMAGE, taskid, filename),
    tag: helpers.tag(filename),
    tag_validated_by: "",
    tag_validated_at: 0,
    iteration_minimum_required: task.iteration_minimum_required,
    iteration_remain: task.iteration_minimum_required,
    answer_hash: {},
    answer_correct: 0,
    answer_incorrect: 0,
    answer_incorrect_hash: {},
    created_at: +new Date(),
  };
  const [url] = await admin
    .storage()
    .bucket()
    .file(image.key)
    .getSignedUrl({
      version: "v4",
      action: "write",
      expires: Date.now() + 60 * 60 * 1000, // 1 hour
      contentType,
    })
    .catch((error) => {
      functions.logger.error(error);
      return [];
    });
  if (!url) {
    return res.status(500).json({ error: "Oops!! Something went wrong!" });
  }

  return res.json({ ...image, url });
});

export default router;
