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
exports.useTask = exports.getQuestion = exports.sync = exports.TAG_SAMPLE_SIZE = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions"));
const uuid_1 = require("uuid");
const lodash_1 = __importDefault(require("lodash"));
const database = __importStar(require("../../database"));
const helpers = __importStar(require("../../helpers"));
exports.TAG_SAMPLE_SIZE = 4;
async function sync(uid) {
    var _a;
    const usertasks = await admin
        .firestore()
        .collection(database.COLLECTION_USER_TASKS)
        .where("user_id", "==", uid)
        .get()
        .then((snapshot) => {
        const tasks = [];
        snapshot.forEach((s) => tasks.push(s.data()));
        return tasks;
    });
    const utaskids = usertasks.map((t) => t.task_id);
    functions.logger.info(`[${uid}] found tasks ${utaskids}`);
    const tasks = [];
    if (usertasks.length) {
        await admin
            .firestore()
            .collection(database.COLLECTION_TASKS)
            .where("id", "not-in", utaskids)
            .get()
            .then((snapshot) => snapshot.forEach((s) => tasks.push(s.data())))
            .catch((err) => functions.logger.error(`[${uid}] ${err.message}`));
    }
    else {
        await admin
            .firestore()
            .collection(database.COLLECTION_TASKS)
            .get()
            .then((snapshot) => snapshot.forEach((s) => tasks.push(s.data())))
            .catch((err) => functions.logger.error(`[${uid}] ${err.message}`));
    }
    if (!tasks.length) {
        functions.logger.error(`[${uid}] no tasks was found`);
        return { count: 0, utasks: [] };
    }
    let icount = 0;
    const utasks = [];
    for (const task of tasks) {
        if (!((_a = task.tags) === null || _a === void 0 ? void 0 : _a.length)) {
            functions.logger.error(`[${task.id}] not tags`);
            continue;
        }
        const batch = admin.firestore().batch();
        const images = await admin
            .firestore()
            .collection(database.COLLECTION_TASK_IMAGES)
            .where("task_id", "==", task.id)
            .get()
            .then((snapshot) => {
            const tasks = [];
            snapshot.forEach((s) => tasks.push(s.data()));
            return tasks;
        });
        if (!images.length) {
            functions.logger.error(`[${uid}/${task.id}] no images`);
            continue;
        }
        icount += images.length;
        const utask = {
            id: uuid_1.v4(),
            user_id: uid,
            task_id: task.id,
            uncompleted_task_image_ids: lodash_1.default.shuffle(images.map((t) => t.id)),
            completed_task_image_ids: [],
            completed_at: 0,
        };
        utasks.push(utask);
        const ref = admin
            .firestore()
            .collection(database.COLLECTION_USER_TASKS)
            .doc(utask.id);
        batch.set(ref, utask, { merge: true });
        await batch.commit();
    }
    return { count: icount, utasks };
}
exports.sync = sync;
async function getQuestion(utask, task) {
    const id = lodash_1.default.first(lodash_1.default.difference(utask.uncompleted_task_image_ids, utask.completed_task_image_ids));
    if (!id) {
        return { status: 400, data: { error: "no more task" } };
    }
    const image = await admin
        .firestore()
        .collection(database.COLLECTION_TASK_IMAGES)
        .doc(id)
        .get()
        .then((s) => s.data())
        .catch((err) => functions.logger.error(`[${id}] ${err.message}`));
    if (!image) {
        return { status: 400, data: { error: "task image was not found" } };
    }
    const signedurl = await helpers.getsignedurl(image.key);
    if (signedurl.error) {
        return { status: 400, data: { error: "could not get image url" } };
    }
    const data = {
        utask,
        task_image_id: image.id,
        image_url: signedurl.url,
        tags: task.tags,
    };
    return { status: 200, data };
}
exports.getQuestion = getQuestion;
function useTask() {
    return async (req, res, next) => {
        var _a;
        const user = res.locals.user;
        const utaskid = req.body.utask_id;
        if (!utaskid) {
            return res.status(404).json({ error: "user task id could not be blank" });
        }
        res.locals.utask = await admin
            .firestore()
            .collection(database.COLLECTION_USER_TASKS)
            .doc(utaskid)
            .get()
            .then((s) => s.data());
        if (((_a = res.locals.utask) === null || _a === void 0 ? void 0 : _a.user_id) != user.id) {
            return res.status(404).json({ error: "user task was not found" });
        }
        res.locals.task = await admin
            .firestore()
            .collection(database.COLLECTION_TASKS)
            .doc(res.locals.utask.task_id)
            .get()
            .then((s) => s.data());
        if (!res.locals.task) {
            return res.status(404).json({ error: "original task was not found" });
        }
        return next();
    };
}
exports.useTask = useTask;
//# sourceMappingURL=logic.js.map