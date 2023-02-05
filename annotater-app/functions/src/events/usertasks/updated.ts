import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import _ from "lodash";

import * as database from "../../database";

export function use() {
  return async function onUserTaskUpdated(
    change: functions.Change<functions.firestore.QueryDocumentSnapshot>,
    context: functions.EventContext
  ) {
    const utask: database.UserTask = change.after.data() as any;
    if (utask.completed_at > 0) return;

    const remain = _.difference(
      utask.uncompleted_task_image_ids,
      utask.completed_task_image_ids
    );
    if (remain.length == 0) {
      await admin
        .firestore()
        .collection(database.COLLECTION_USER_TASKS)
        .doc(utask.id)
        .update({ completed_at: +new Date() })
        .catch((err) => functions.logger.error(err.message));
    }
  };
}
