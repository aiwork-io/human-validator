import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import _ from "lodash";

import * as database from "../../database";

export function use() {
  return async function onTaskHistoriesCreated(
    snap: functions.firestore.QueryDocumentSnapshot,
    context: functions.EventContext
  ) {
    const history: database.UserTaskHistory = snap.data() as any;
    const logkey = [
      history.id,
      history.user_id,
      history.user_task_id,
      history.task_id,
      history.task_image_id,
    ].join("/");

    await reduceiteration(logkey, history);
    await report(logkey, history);

    functions.logger.info(`[${logkey}] ${database.COLLECTION_USER_TASKS} +1`);
  };
}

export async function reduceiteration(
  logkey: string,
  history: database.UserTaskHistory
) {
  await admin
    .firestore()
    .collection(database.COLLECTION_TASK_IMAGES)
    .doc(history.task_image_id)
    .update({ iteration_remain: admin.firestore.FieldValue.increment(-1) })
    .catch((err) => functions.logger.error(`[${logkey}] ${err.message}`));
}

export async function report(
  logkey: string,
  history: database.UserTaskHistory,
  withanswerhash = true
) {
  if (withanswerhash) {
    // store the awnser in the hash
    await admin
      .firestore()
      .collection(database.COLLECTION_TASK_IMAGES)
      .doc(history.task_image_id)
      .update({
        [`answer_hash.${history.tag}`]: admin.firestore.FieldValue.increment(1),
      })
      .catch((err) => functions.logger.error(`[${logkey}] ${err.message}`));
  }

  // only report when the task image was validated
  if (history.task_image_tag_validated_at <= 0) return;

  // update correct
  if (history.ok) {
    await admin
      .firestore()
      .collection(database.COLLECTION_TASK_IMAGES)
      .doc(history.task_image_id)
      .update({ answer_correct: admin.firestore.FieldValue.increment(1) })
      .catch((err) => functions.logger.error(`[${logkey}] ${err.message}`));

    await admin
      .firestore()
      .collection(database.COLLECTION_USERS)
      .doc(history.user_id)
      .update({ points: admin.firestore.FieldValue.increment(1) })
      .catch((err) => {
        functions.logger.error(`${logkey} ${err.message}`);
      });

    functions.logger.info(`[${logkey}] ok | ${history.user_id} +1`);
  }

  // update incorrect
  if (!history.ok) {
    await admin
      .firestore()
      .collection(database.COLLECTION_TASK_IMAGES)
      .doc(history.task_image_id)
      .update({ answer_incorrect: admin.firestore.FieldValue.increment(1) })
      .catch((err) => functions.logger.error(`[${logkey}] ${err.message}`));

    await admin
      .firestore()
      .collection(database.COLLECTION_TASK_IMAGES)
      .doc(history.task_image_id)
      .update({
        [`answer_incorrect_hash.${history.tag}`]:
          admin.firestore.FieldValue.increment(1),
      })
      .catch((err) => functions.logger.error(`[${logkey}] ${err.message}`));

    functions.logger.info(`[${logkey}] not ok`);
  }
}
