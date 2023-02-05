import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import _ from "lodash";

import * as database from "../../database";
import * as usertaskhistories from "../usertaskhistories";

export function use() {
  return async function onTaskImageUpdated(
    change: functions.Change<functions.firestore.QueryDocumentSnapshot>,
    context: functions.EventContext
  ) {
    const before: database.TaskImage = change.before.data() as any;
    const after: database.TaskImage = change.after.data() as any;

    const validating =
      before.tag_validated_at <= 0 && after.tag_validated_at > 0;
    if (validating) {
      // increase validated count
      await admin
        .firestore()
        .collection(database.COLLECTION_TASKS)
        .doc(after.task_id)
        .update({ validated_count: admin.firestore.FieldValue.increment(1) })
        .catch((err) =>
          functions.logger.error(`[${after.task_id}] ${err.message}`)
        );

      await validate(after);
    }

    // all required iterations was done
    if (before.iteration_remain > 0 && after.iteration_remain === 0) {
      await consumeiteration(after);
    }
  };
}

async function validate(image: database.TaskImage) {
  const histories = await admin
    .firestore()
    .collection(database.COLLECTION_USER_TASK_HISTORIES)
    .where("task_image_id", "==", image.id)
    .where("task_image_tag_validated_at", "==", 0)
    .get()
    .then((snapshot) => {
      const tasks: database.UserTaskHistory[] = [];
      snapshot.forEach((s) => tasks.push(s.data() as any));
      return tasks;
    });
  if (!histories.length) return;

  const chunks = _.chunk(histories, 20);
  for (const chunk of chunks) {
    await Promise.all(
      chunk.map(async (history) => {
        const logkey = [
          history.id,
          history.user_id,
          history.user_task_id,
          history.task_id,
          history.task_image_id,
        ].join("/");

        history.task_image_tag_validated_at = image.tag_validated_at;
        history.ok = Number(history.tag === image.tag);

        await admin
          .firestore()
          .collection(database.COLLECTION_USER_TASK_HISTORIES)
          .doc(history.id)
          .set(history, { merge: true })
          .catch((err) => functions.logger.error(`[${logkey}] ${err.message}`));

        functions.logger.info(`[${logkey}] validating`);
        return usertaskhistories.created.report(logkey, history, false);
      })
    );
  }
}

async function consumeiteration(image: database.TaskImage) {
  const logkey = [image.id, image.user_id, image.task_id].join("/");

  const icr = admin.firestore.FieldValue.increment(
    -image.iteration_minimum_required
  );
  await admin
    .firestore()
    .collection(database.COLLECTION_TASKS)
    .doc(image.task_id)
    .update({ iteration_remain: icr })
    .catch((err) => functions.logger.error(`[${logkey}] ${err.message}`));
}
