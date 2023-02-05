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
exports.report = exports.reduceiteration = exports.use = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions"));
const database = __importStar(require("../../database"));
function use() {
    return async function onTaskHistoriesCreated(snap, context) {
        const history = snap.data();
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
exports.use = use;
async function reduceiteration(logkey, history) {
    await admin
        .firestore()
        .collection(database.COLLECTION_TASKS)
        .doc(history.task_id)
        .update({ iteration_remain: admin.firestore.FieldValue.increment(-1) })
        .catch((err) => functions.logger.error(`[${logkey}] ${err.message}`));
    await admin
        .firestore()
        .collection(database.COLLECTION_TASK_IMAGES)
        .doc(history.task_image_id)
        .update({ iteration_remain: admin.firestore.FieldValue.increment(-1) })
        .catch((err) => functions.logger.error(`[${logkey}] ${err.message}`));
}
exports.reduceiteration = reduceiteration;
async function report(logkey, history, withanswerhash = true) {
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
    if (history.task_image_tag_validated_at <= 0)
        return;
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
            [`answer_incorrect_hash.${history.tag}`]: admin.firestore.FieldValue.increment(1),
        })
            .catch((err) => functions.logger.error(`[${logkey}] ${err.message}`));
        functions.logger.info(`[${logkey}] not ok`);
    }
}
exports.report = report;
//# sourceMappingURL=created.js.map