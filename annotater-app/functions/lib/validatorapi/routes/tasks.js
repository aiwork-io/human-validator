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
const express_1 = require("express");
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions"));
const database = __importStar(require("../../database"));
const helpers = __importStar(require("../../helpers"));
const logic = __importStar(require("./logic"));
const router = express_1.Router();
router.param("task_id", async function gettask(req, res, next, id) {
    const task = await admin
        .firestore()
        .collection(database.COLLECTION_TASKS)
        .doc(id)
        .get()
        .then((s) => s.data());
    if (!task)
        return res.status(404).json({ error: "task was not found" });
    res.locals.task = task;
    return next();
});
router.param("image_id", async function gettask(req, res, next, id) {
    const image = await admin
        .firestore()
        .collection(database.COLLECTION_TASK_IMAGES)
        .doc(id)
        .get()
        .then((s) => s.data());
    if (!image)
        return res.status(404).json({ error: "image was not found" });
    res.locals.image = image;
    return next();
});
router.get("/", async function create(req, res) {
    var _a;
    const cursor = Number(req.query._cursor || "");
    const limit = Number(req.query._limit || "") || 10;
    const data = await admin
        .firestore()
        .collection(database.COLLECTION_TASKS)
        .orderBy("created_at", "asc")
        .startAfter(cursor)
        .limit(limit)
        .get()
        .then((snapshot) => {
        const tasks = [];
        snapshot.forEach((s) => tasks.push(s.data()));
        return tasks;
    });
    const next = data.length === limit ? Number(((_a = data[data.length - 1]) === null || _a === void 0 ? void 0 : _a.created_at) || 0) : 0;
    return res.json({ data, cursor: next });
});
router.get("/:task_id/images", async function create(req, res) {
    var _a;
    const task = res.locals.task;
    const cursor = Number(req.query._cursor || "");
    const limit = Number(req.query._limit || "") || 10;
    const images = await admin
        .firestore()
        .collection(database.COLLECTION_TASK_IMAGES)
        .where("task_id", "==", task.id)
        .orderBy("created_at", "asc")
        .startAfter(cursor)
        .limit(limit)
        .get()
        .then((snapshot) => {
        const tasks = [];
        snapshot.forEach((s) => tasks.push(s.data()));
        return tasks;
    });
    const data = await Promise.all(images.map(async (image) => {
        const signedurl = await helpers.getsignedurl(image.key);
        return Object.assign(Object.assign({}, image), { image_url: signedurl.url });
    }));
    const next = data.length === limit ? Number(((_a = data[data.length - 1]) === null || _a === void 0 ? void 0 : _a.created_at) || 0) : 0;
    return res.json({ data, cursor: next });
});
router.get("/:task_id/images/:image_id", async function index(req, res) {
    const task = res.locals.task;
    const image = res.locals.image;
    image.task = task;
    const signedurl = await helpers.getsignedurl(image.key);
    return res.json(Object.assign(Object.assign({}, image), { image_url: signedurl.url }));
});
router.get("/:task_id/images/:image_id/next", async function index(req, res) {
    const task = res.locals.task;
    const image = res.locals.image;
    const nextimage = await logic.next(task, image);
    if (!nextimage)
        return res.status(404).json({ error: "no more task image " });
    const prevsignedurl = await helpers.getsignedurl(image.key);
    const nextsignedurl = await helpers.getsignedurl(nextimage.key);
    return res.json({
        prev: Object.assign(Object.assign({}, image), { image_url: prevsignedurl.url }),
        next: Object.assign(Object.assign({}, nextimage), { image_url: nextsignedurl.url }),
    });
});
router.get("/:task_id/images/:image_id/prev", async function index(req, res) {
    const task = res.locals.task;
    const image = res.locals.image;
    const previmage = await logic.prev(task, image);
    if (!previmage)
        return res.status(404).json({ error: "no more task image " });
    const prevsignedurl = await helpers.getsignedurl(previmage.key);
    const nextsignedurl = await helpers.getsignedurl(image.key);
    return res.json({
        prev: Object.assign(Object.assign({}, previmage), { image_url: prevsignedurl.url }),
        next: Object.assign(Object.assign({}, image), { image_url: nextsignedurl.url }),
    });
});
router.post("/:task_id/images/:image_id/validation", async function index(req, res) {
    const user = res.locals.user;
    const task = res.locals.task;
    const image = res.locals.image;
    if (image.tag_validated_at > 0) {
        return res.status(400).json({ error: "tag has been validated already" });
    }
    const dto = req.body;
    if (!dto.tag) {
        return res.status(400).json({ error: "tag could not be blank" });
    }
    const update = {
        tag: dto.tag,
        tag_validated_at: +new Date(),
        tag_validated_by: user.id,
    };
    const logkey = [task.id, image.id, user.id].join("/");
    const r = await admin
        .firestore()
        .collection(database.COLLECTION_TASK_IMAGES)
        .doc(image.id)
        .set(update, { merge: true })
        .catch((err) => functions.logger.error(`[${logkey}] ${err.message}`));
    if (!r)
        res.status(500).json({ error: "update was failed" });
    return res.json({ task_id: task.id, image_id: image.id, tag: dto.tag });
});
exports.default = router;
//# sourceMappingURL=tasks.js.map