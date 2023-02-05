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
const express_1 = require("express");
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions"));
const lodash_1 = __importDefault(require("lodash"));
const helpers = __importStar(require("../../helpers"));
const database = __importStar(require("../../database"));
const logic = __importStar(require("./logic"));
const router = express_1.Router();
router.post("/", async function index(req, res) {
    const user = res.locals.user;
    const { count, utasks } = await logic.sync(user.id);
    return res.json({
        tasks: utasks.map((t) => t.id),
        images: count,
    });
});
router.get("/", async function index(req, res) {
    const user = res.locals.user;
    const data = await admin
        .firestore()
        .collection(database.COLLECTION_USER_TASKS)
        .where("user_id", "==", user.id)
        .get()
        .then((snapshot) => {
        const tasks = [];
        snapshot.forEach((s) => tasks.push(s.data()));
        return tasks;
    });
    return res.json({ data, count: data.length });
});
router.get("/next", async function index(req, res) {
    const user = res.locals.user;
    await logic.sync(user.id);
    const utasks = await admin
        .firestore()
        .collection(database.COLLECTION_USER_TASKS)
        .where("completed_at", "==", 0)
        .where("user_id", "==", user.id)
        .get()
        .then((snapshot) => {
        const tasks = [];
        snapshot.forEach((s) => tasks.push(s.data()));
        return tasks;
    });
    for (const utask of utasks) {
        const task = await admin
            .firestore()
            .collection(database.COLLECTION_TASKS)
            .doc(utask.task_id)
            .get()
            .then((s) => s.data());
        if (!task)
            return res.status(404).json({ error: "task was not found" });
        const { status, data } = await logic.getQuestion(utask, task);
        if (status === 200)
            return res.status(status).json(data);
    }
    return res.status(404).json({ error: "no more user task" });
});
router.post("/answer", logic.useTask(), async function index(req, res) {
    const user = res.locals.user;
    const task = res.locals.task;
    const utask = res.locals.utask;
    const body = req.body;
    if (!body.tag || !body.task_image_id) {
        return res.status(400).json({ error: "empty answer" });
    }
    const logid = [task.id, utask.id, user.id].join("/");
    const logkey = `[POST ${req.path} - ${logid}]`;
    const image = await admin
        .firestore()
        .collection(database.COLLECTION_TASK_IMAGES)
        .doc(body.task_image_id)
        .get()
        .then((s) => s.data());
    if (!image) {
        return res.status(400).json({ error: "invalid answer" });
    }
    // collect submit histories
    const ok = image.tag_validated_at > 0 &&
        image.tag.toLowerCase().trim() === body.tag.toLowerCase().trim();
    const history = {
        id: helpers.md5(user.id, task.id, body.task_image_id),
        user_id: user.id,
        task_id: task.id,
        user_task_id: utask.id,
        task_image_id: body.task_image_id,
        task_image_tag_validated_at: image.tag_validated_at,
        tag: body.tag,
        created_at: new Date().toISOString(),
        ok: Number(ok),
    };
    const record = await admin
        .firestore()
        .collection(database.COLLECTION_USER_TASK_HISTORIES)
        .doc(history.id)
        .get();
    if (record.exists) {
        return res
            .status(400)
            .json({ error: "you have answer this question already" });
    }
    await admin
        .firestore()
        .collection(database.COLLECTION_USER_TASK_HISTORIES)
        .doc(history.id)
        .set(history)
        .catch((err) => {
        functions.logger.error(`${logkey} ${err.message}`);
    });
    await admin
        .firestore()
        .collection(database.COLLECTION_USER_TASKS)
        .doc(history.user_task_id)
        .update({
        completed_task_image_ids: admin.firestore.FieldValue.arrayUnion(history.task_image_id),
    })
        .catch((err) => {
        functions.logger.error(`${logkey} ${err.message}`);
    });
    return res.json(lodash_1.default.pick(history, ["id"]));
});
router.post("/skip", logic.useTask(), async function index(req, res) {
    const user = res.locals.user;
    const task = res.locals.task;
    const utask = res.locals.utask;
    const body = req.body;
    if (!body.task_image_id) {
        return res.status(400).json({ error: "empty image id" });
    }
    const logid = [task.id, utask.id, user.id].join("/");
    const logkey = `[POST ${req.path} - ${logid}]`;
    const image = await admin
        .firestore()
        .collection(database.COLLECTION_TASK_IMAGES)
        .doc(body.task_image_id)
        .get()
        .then((s) => s.data());
    if (!image) {
        return res.status(400).json({ error: "invalid image" });
    }
    const hsitoryid = helpers.md5(user.id, task.id, body.task_image_id);
    const record = await admin
        .firestore()
        .collection(database.COLLECTION_USER_TASK_HISTORIES)
        .doc(hsitoryid)
        .get();
    if (record.exists) {
        return res
            .status(400)
            .json({ error: "you have answer this question already" });
    }
    await admin
        .firestore()
        .collection(database.COLLECTION_USER_TASKS)
        .doc(utask.id)
        .update({
        completed_task_image_ids: admin.firestore.FieldValue.arrayUnion(image.id),
    })
        .catch((err) => {
        functions.logger.error(`${logkey} ${err.message}`);
    });
    return res.json({
        user_id: user.id,
        task_id: task.id,
        user_task_id: utask.id,
    });
});
exports.default = router;
//# sourceMappingURL=task.js.map