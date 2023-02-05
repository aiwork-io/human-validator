import path from "path";
import fs from "fs";
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import _ from "lodash";

import * as constants from "../../constants";
import * as helpers from "../../helpers";
import * as database from "../../database";

export function use() {
  return async function onFileCreated(
    object: functions.storage.ObjectMetadata
  ) {
    await unzip(object).catch(functions.logger.error);
    await add(object).catch(functions.logger.error);
  };
}

async function unzip(object: functions.storage.ObjectMetadata) {
  const filepath = String(object.name);
  if (!filepath.startsWith(constants.FOLDER_TASK_ZIP)) {
    return;
  }

  const id = path.basename(filepath, ".zip");

  const destination = `/tmp/${filepath}`;
  await fs.promises
    .mkdir(path.dirname(destination), { recursive: true })
    .catch((err) => functions.logger.error(`[${id}] ${err.message}`));
  await admin
    .storage()
    .bucket()
    .file(filepath)
    .download({ destination, validation: false })
    .catch((err) => functions.logger.error(`[${id}] ${err.message}`));

  const task: database.Task = {
    id,
    user_id: constants.ADMIN_ID,
    tags: [],
    unzip_at: +new Date(),
    iteration_minimum_required: 0,
    iteration_total: 0,
    iteration_remain: 0,
    validated_count: 0,
    created_at: +new Date(),
  };
  await admin
    .firestore()
    .collection(database.COLLECTION_TASKS)
    .doc(task.id)
    .set(task, { merge: true })
    .then(() => true)
    .catch((err) => {
      functions.logger.error(`[${task.id}] ${err.message}`);
      return false;
    });
  functions.logger.info(`[${id}] created`);

  const timages: database.TaskImage[] = [];
  const paths = await helpers.unzip(destination);
  const chunks = _.chunk(paths, 5);
  for (const chunk of chunks) {
    const items = await Promise.all(
      chunk.map((filepath) => {
        const filename = path.basename(filepath);
        const destination = path.join(
          constants.FOLDER_TASK_IMAGE,
          id,
          filename
        );
        return admin
          .storage()
          .bucket()
          .upload(filepath, { destination })
          .then(
            () =>
              ({
                id: helpers.md5(destination),
                task_id: task.id,
                key: destination,
                tag: helpers.tag(filename),
                tag_validated_by: "",
              } as database.TaskImage)
          )
          .catch((err) => {
            functions.logger.error(`[${id} - ${filepath}] ${err.message}`);
            return null;
          });
      })
    );

    timages.push(...(items.filter(Boolean) as any));
  }

  task.iteration_minimum_required = 1;
  task.iteration_total = 0;
  task.iteration_remain = 0;
  await admin
    .firestore()
    .collection(database.COLLECTION_TASKS)
    .doc(task.id)
    .set(task, { merge: true })
    .then(() => true)
    .catch((err) => {
      functions.logger.error(`[${task.id}] ${err.message}`);
      return false;
    });

  functions.logger.info(`[${id}] unzip completed`);
}

async function add(object: functions.storage.ObjectMetadata) {
  const filepath = String(object.name);
  if (!filepath.startsWith(constants.FOLDER_TASK_IMAGE)) {
    return;
  }

  const unknown = filepath.split("/");
  const filename = unknown.pop() || "";
  const taskid = unknown.pop() || "";
  if (!taskid) {
    functions.logger.error(`[${filepath}] no task id`);
  }
  if (!filename) {
    functions.logger.error(`[${filepath}] no filename`);
  }

  const task: database.Task = await admin
    .firestore()
    .collection(database.COLLECTION_TASKS)
    .doc(taskid)
    .get()
    .then((s) => s.data() as any);
  if (!task) {
    functions.logger.error(`[${filepath}] no task`);
    return;
  }

  const timage: database.TaskImage = {
    id: helpers.md5(filepath),
    task_id: task.id,
    user_id: task.user_id,
    key: filepath,
    tag: helpers.tag(filename),
    tag_validated_by: "",
    tag_validated_at: 0,
    iteration_minimum_required: task.iteration_minimum_required,
    iteration_remain: task.iteration_minimum_required,
    answer_hash: {},
    answer_correct: 0,
    answer_incorrect: 0,
    answer_incorrect_hash: {},
    created_at: +new Date(object.timeCreated),
  };
  await admin
    .firestore()
    .collection(database.COLLECTION_TASK_IMAGES)
    .doc(timage.id)
    .set(timage, { merge: true })
    .then(() => true)
    .catch((err) => {
      functions.logger.error(`[${timage.task_id}] ${err.message}`);
      return false;
    });

  // calculate task iterations
  await Promise.all([
    await admin
      .firestore()
      .collection(database.COLLECTION_TASKS)
      .doc(task.id)
      .update({
        iteration_total: admin.firestore.FieldValue.increment(
          task.iteration_minimum_required
        ),
      })
      .catch((err) => {
        functions.logger.error(`[${timage.task_id}] ${err.message}`);
        return false;
      }),
    await admin
      .firestore()
      .collection(database.COLLECTION_TASKS)
      .doc(task.id)
      .update({
        iteration_remain: admin.firestore.FieldValue.increment(
          task.iteration_minimum_required
        ),
      })
      .catch((err) => {
        functions.logger.error(`[${timage.task_id}] ${err.message}`);
        return false;
      }),
  ]);

  functions.logger.info(
    `[${timage.task_id}/${timage.id}] add completed - unknown:${unknown}`
  );
}
