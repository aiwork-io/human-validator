import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { UserRecord } from "firebase-functions/v1/auth";

import * as database from "../../database";

export function use() {
  return async function OnUserCreated(r: UserRecord) {
    const user: database.User = {
      id: r.uid,
      name: r.displayName || r.email || "",
      email: r.email || "",
      avatar: r.photoURL || "",
      wallet: r.displayName || "",
      points: 0,
      metadata: r.toJSON(),
    };

    await admin
      .firestore()
      .collection(database.COLLECTION_USERS)
      .doc(user.id)
      .set(user, { merge: true })
      .catch((err) =>
        functions.logger.error(`[${user.id}/${user.name}] ${err.message}`)
      );
    functions.logger.info(`[${user.id}] created`);
  };
}
