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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.use = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions"));
const lodash_1 = __importDefault(require("lodash"));
const database = __importStar(require("../../database"));
const usertaskhistories = __importStar(require("../usertaskhistories"));
function use() {
    return async function onTaskImageUpdated(change, context) {
        const before = change.before.data();
        const after = change.after.data();
        const validating = before.tag_validated_at <= 0 && after.tag_validated_at > 0;
        if (validating) {
            // increase validated count
            await admin
                .firestore()
                .collection(database.COLLECTION_TASKS)
                .doc(after.task_id)
                .update({ validated_count: admin.firestore.FieldValue.increment(1) })
                .catch((err) => functions.logger.error(`[${after.task_id}] ${err.message}`));
            await validate(after);
        }
    };
}
exports.use = use;
async function validate(image) {
    const histories = await admin
        .firestore()
        .collection(database.COLLECTION_USER_TASK_HISTORIES)
        .where("task_image_id", "==", image.id)
        .where("task_image_tag_validated_at", "==", 0)
        .get()
        .then((snapshot) => {
        const tasks = [];
        snapshot.forEach((s) => tasks.push(s.data()));
        return tasks;
    });
    if (!histories.length)
        return;
    const chunks = lodash_1.default.chunk(histories, 20);
    for (const chunk of chunks) {
        await Promise.all(chunk.map(async (history) => {
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
        }));
    }
}
//# sourceMappingURL=updated.js.map