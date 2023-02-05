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
const path_1 = __importDefault(require("path"));
const express_1 = require("express");
const uuid_1 = require("uuid");
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions"));
const json2csv_1 = require("json2csv");
const database = __importStar(require("../../database"));
const helpers = __importStar(require("../../helpers"));
const router = express_1.Router();
router.post("/", async function create(req, res) {
    const user = res.locals.user;
    const dto = req.body;
    const minimumok = Number.isFinite(dto.iteration_minimum_required) &&
        dto.iteration_minimum_required > 0;
    if (!minimumok) {
        return res.status(400).json({ error: "iteration must greater than zero" });
    }
    const tagsok = Array.isArray(dto.tags) && dto.tags.length > 0;
    if (!tagsok) {
        return res.status(400).json({ error: "tags array could not be blank" });
    }
    const task = {
        id: String(req.query.task_id || "") || uuid_1.v4(),
        user_id: user.id,
        tags: dto.tags,
        iteration_minimum_required: dto.iteration_minimum_required,
        iteration_total: 0,
        iteration_remain: 0,
        unzip_at: +new Date(),
        validated_count: 0,
        created_at: +new Date(),
    };
    const err = await admin
        .firestore()
        .collection(database.COLLECTION_TASKS)
        .doc(task.id)
        .set(task, { merge: true })
        .then(() => null)
        .catch((err) => err);
    if (err) {
        functions.logger.error(`[${task.id}] ${err.message}`);
        return res.status(500).json({ error: "could not create new task" });
    }
    return res.json(task);
});
router.get("/", async function create(req, res) {
    var _a;
    const user = res.locals.user;
    const cursor = Number(req.query._cursor || "") || 0;
    const limit = Number(req.query._limit || "") || 100;
    const data = await admin
        .firestore()
        .collection(database.COLLECTION_TASKS)
        .orderBy("created_at")
        .where("user_id", "==", user.id)
        .startAfter(cursor)
        .limit(limit)
        .get()
        .then((snapshot) => {
        const tasks = [];
        snapshot.forEach((s) => {
            const task = s.data();
            task.iteration_remain = Math.max(task.iteration_remain, 0);
            tasks.push(task);
        });
        return tasks;
    });
    const next = data.length === limit ? Number(((_a = data[data.length - 1]) === null || _a === void 0 ? void 0 : _a.created_at) || 0) : 0;
    return res.json({ data, cursor: next });
});
router.get("/:task_id/report", async function create(req, res) {
    const user = res.locals.user;
    const task = await admin
        .firestore()
        .collection(database.COLLECTION_TASKS)
        .doc(req.params.task_id)
        .get()
        .then((s) => s.data());
    if (task.user_id != user.id) {
        return res.status(404).json({ error: "task was not found or deleted" });
    }
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
        return res.status(404).json({ error: "no report" });
    }
    const rows = images.map((i) => ({
        Id: i.id,
        Name: path_1.default.basename(i.key),
        "Correct (%)": helpers.countcorrectpercentage(i),
        "Most Incorrect": helpers.getmostincorrectag(i),
    }));
    const csv = json2csv_1.parse(rows, {
        fields: ["Id", "Name", "Correct (%)", "Most Incorrect"],
    });
    res.setHeader("Content-disposition", `attachment; filename="report_${task.id}.csv"`);
    res.set("Content-Type", "text/csv; charset=UTF-8");
    return res.status(200).send(csv);
});
exports.default = router;
//# sourceMappingURL=task.js.map