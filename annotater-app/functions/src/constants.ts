import * as functions from "firebase-functions";

export const BUCKET_NAME =
  functions.config().storage?.bucket || "aiworklabletool.appspot.com";

export const PROJECT_LOCATION =
  functions.config().storage?.location || "asia-southeast1";

export const FOLDER_TASK_ZIP =
  functions.config().folders?.task?.zip || "task_zip";

export const FOLDER_TASK_IMAGE =
  functions.config().folders?.task?.images || "task_images";

export const ADMIN_ID = "2391b819-170b-4873-9ba0-6ecbda589a64";

export const USER_ID = "64dfda53-4fb7-4464-9512-e27b4d8f2ffe";
