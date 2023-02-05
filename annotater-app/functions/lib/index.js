"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onUserTaskHistoriesCreated = exports.onUserTaskUpdated = exports.onTaskImageUpdate = exports.onFileCreated = exports.validator = exports.user = exports.admin = exports.onUseCreated = void 0;
require("dotenv").config();
const fadmin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions"));
const constants = __importStar(require("./constants"));
const database = __importStar(require("./database"));
const adminapi = __importStar(require("./adminapi"));
const userapi = __importStar(require("./userapi"));
const validatorapi = __importStar(require("./validatorapi"));
const events = __importStar(require("./events"));
fadmin.initializeApp({
    storageBucket: `gs://${constants.BUCKET_NAME}`,
});
exports.onUseCreated = functions.auth
    .user()
    .onCreate(events.user.created.use());
exports.admin = functions
    .region(constants.PROJECT_LOCATION)
    .runWith({ timeoutSeconds: 540, memory: "512MB" })
    .https.onRequest(adminapi.create());
exports.user = functions
    .region(constants.PROJECT_LOCATION)
    .runWith({ timeoutSeconds: 540, memory: "512MB" })
    .https.onRequest(userapi.create());
exports.validator = functions
    .region(constants.PROJECT_LOCATION)
    .runWith({ timeoutSeconds: 540, memory: "512MB" })
    .https.onRequest(validatorapi.create());
exports.onFileCreated = functions
    .region(constants.PROJECT_LOCATION)
    .runWith({ timeoutSeconds: 540, memory: "512MB" })
    .storage.object()
    .onFinalize(events.file.created.use());
exports.onTaskImageUpdate = functions
    .region(constants.PROJECT_LOCATION)
    .runWith({ timeoutSeconds: 540, memory: "512MB" })
    .firestore.document(`${database.COLLECTION_TASK_IMAGES}/{task_image_id}`)
    .onUpdate(events.taskimages.updated.use());
exports.onUserTaskUpdated = functions
    .region(constants.PROJECT_LOCATION)
    .runWith({ timeoutSeconds: 540, memory: "512MB" })
    .firestore.document(`${database.COLLECTION_USER_TASKS}/{utask_id}`)
    .onUpdate(events.usertasks.updated.use());
exports.onUserTaskHistoriesCreated = functions
    .region(constants.PROJECT_LOCATION)
    .runWith({ timeoutSeconds: 540, memory: "512MB" })
    .firestore.document(`${database.COLLECTION_USER_TASK_HISTORIES}/{history_id}`)
    .onCreate(events.usertaskhistories.created.use());
//# sourceMappingURL=index.js.map