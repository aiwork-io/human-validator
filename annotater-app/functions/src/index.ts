require("dotenv").config();

import * as fadmin from "firebase-admin";
import * as functions from "firebase-functions";

import * as constants from "./constants";
import * as database from "./database";
import * as adminapi from "./adminapi";
import * as userapi from "./userapi";
import * as validatorapi from "./validatorapi";
import * as events from "./events";

fadmin.initializeApp({
  storageBucket: `gs://${constants.BUCKET_NAME}`,
});

export const onUseCreated = functions.auth
  .user()
  .onCreate(events.user.created.use());

export const admin = functions
  .region(constants.PROJECT_LOCATION)
  .runWith({ timeoutSeconds: 540, memory: "512MB" })
  .https.onRequest(adminapi.create());

export const user = functions
  .region(constants.PROJECT_LOCATION)
  .runWith({ timeoutSeconds: 540, memory: "512MB" })
  .https.onRequest(userapi.create());

export const validator = functions
  .region(constants.PROJECT_LOCATION)
  .runWith({ timeoutSeconds: 540, memory: "512MB" })
  .https.onRequest(validatorapi.create());

export const onFileCreated = functions
  .region(constants.PROJECT_LOCATION)
  .runWith({ timeoutSeconds: 540, memory: "512MB" })
  .storage.object()
  .onFinalize(events.file.created.use());

export const onTaskImageUpdate = functions
  .region(constants.PROJECT_LOCATION)
  .runWith({ timeoutSeconds: 540, memory: "512MB" })
  .firestore.document(`${database.COLLECTION_TASK_IMAGES}/{task_image_id}`)
  .onUpdate(events.taskimages.updated.use());

export const onUserTaskUpdated = functions
  .region(constants.PROJECT_LOCATION)
  .runWith({ timeoutSeconds: 540, memory: "512MB" })
  .firestore.document(`${database.COLLECTION_USER_TASKS}/{utask_id}`)
  .onUpdate(events.usertasks.updated.use());

export const onUserTaskHistoriesCreated = functions
  .region(constants.PROJECT_LOCATION)
  .runWith({ timeoutSeconds: 540, memory: "512MB" })
  .firestore.document(`${database.COLLECTION_USER_TASK_HISTORIES}/{history_id}`)
  .onCreate(events.usertaskhistories.created.use());
