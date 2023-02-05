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
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions"));
const lodash_1 = __importDefault(require("lodash"));
const constants = __importStar(require("../../constants"));
const helpers = __importStar(require("../../helpers"));
const database = __importStar(require("../../database"));
function use() {
    return async function onFileCreated(object) {
        await unzip(object).catch(functions.logger.error);
        await add(object).catch(functions.logger.error);
    };
}
exports.use = use;
async function unzip(object) {
    const filepath = String(object.name);
    if (!filepath.startsWith(constants.FOLDER_TASK_ZIP)) {
        return;
    }
    const id = path_1.default.basename(filepath, ".zip");
    const destination = `/tmp/${filepath}`;
    await fs_1.default.promises
        .mkdir(path_1.default.dirname(destination), { recursive: true })
        .catch((err) => functions.logger.error(`[${id}] ${err.message}`));
    await admin
        .storage()
        .bucket()
        .file(filepath)
        .download({ destination, validation: false })
        .catch((err) => functions.logger.error(`[${id}] ${err.message}`));
    const task = {
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
    const timages = [];
    const paths = await helpers.unzip(destination);
    const chunks = lodash_1.default.chunk(paths, 5);
    for (const chunk of chunks) {
        const items = await Promise.all(chunk.map((filepath) => {
            const filename = path_1.default.basename(filepath);
            const destination = path_1.default.join(constants.FOLDER_TASK_IMAGE, id, filename);
            return admin
                .storage()
                .bucket()
                .upload(filepath, { destination })
                .then(() => ({
                id: helpers.md5(destination),
                task_id: task.id,
                key: destination,
                tag: helpers.tag(filename),
                tag_validated_by: "",
            }))
                .catch((err) => {
                functions.logger.error(`[${id} - ${filepath}] ${err.message}`);
                return null;
            });
        }));
        timages.push(...items.filter(Boolean));
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
async function add(object) {
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
    const task = await admin
        .firestore()
        .collection(database.COLLECTION_TASKS)
        .doc(taskid)
        .get()
        .then((s) => s.data());
    if (!task) {
        functions.logger.error(`[${filepath}] no task`);
        return;
    }
    const timage = {
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
            iteration_total: admin.firestore.FieldValue.increment(task.iteration_minimum_required),
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
            iteration_remain: admin.firestore.FieldValue.increment(task.iteration_minimum_required),
        })
            .catch((err) => {
            functions.logger.error(`[${timage.task_id}] ${err.message}`);
            return false;
        }),
    ]);
    functions.logger.info(`[${timage.task_id}/${timage.id}] add completed - unknown:${unknown}`);
}
//# sourceMappingURL=created.js.map