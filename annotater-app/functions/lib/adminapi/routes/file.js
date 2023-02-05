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
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions"));
const uuid_1 = require("uuid");
const constants = __importStar(require("../../constants"));
const database = __importStar(require("../../database"));
const helpers = __importStar(require("../../helpers"));
const router = express_1.Router();
router.get("/upload/zip", async function index(req, res) {
    const filename = `${uuid_1.v4()}.zip`;
    const filekey = path_1.default.join(constants.FOLDER_TASK_ZIP, filename);
    const [signedUrl] = await admin
        .storage()
        .bucket()
        .file(filekey)
        .getSignedUrl({
        version: "v4",
        action: "write",
        expires: Date.now() + 60 * 60 * 1000,
        contentType: "application/zip",
    })
        .catch((error) => {
        functions.logger.error(error);
        return [];
    });
    if (!signedUrl) {
        return res.status(500).json({ error: "Oops!! Something went wrong!" });
    }
    return res.json({ key: filekey, url: signedUrl });
});
router.get("/upload/png", async function index(req, res) {
    const user = res.locals.user;
    const contentType = req.query.content_type;
    if (!contentType) {
        return res
            .status(400)
            .json({ error: "file content type could not be blank" });
    }
    const taskid = req.query.task_id;
    if (!taskid) {
        return res.status(400).json({ error: "task id could not be blank" });
    }
    const task = await admin
        .firestore()
        .collection(database.COLLECTION_TASKS)
        .doc(taskid)
        .get()
        .then((s) => s.data());
    if (!task) {
        return res.status(400).json({ error: "task was not found" });
    }
    const filename = req.query.filename;
    if (!filename) {
        return res.status(400).json({ error: "filename could not be blank" });
    }
    const image = {
        id: uuid_1.v4(),
        user_id: user.id,
        task_id: taskid,
        key: path_1.default.join(constants.FOLDER_TASK_IMAGE, taskid, filename),
        tag: helpers.tag(filename),
        tag_validated_by: "",
        tag_validated_at: 0,
        iteration_minimum_required: task.iteration_minimum_required,
        iteration_remain: task.iteration_minimum_required,
        answer_hash: {},
        answer_correct: 0,
        answer_incorrect: 0,
        answer_incorrect_hash: {},
        created_at: +new Date(),
    };
    const [url] = await admin
        .storage()
        .bucket()
        .file(image.key)
        .getSignedUrl({
        version: "v4",
        action: "write",
        expires: Date.now() + 60 * 60 * 1000,
        contentType,
    })
        .catch((error) => {
        functions.logger.error(error);
        return [];
    });
    if (!url) {
        return res.status(500).json({ error: "Oops!! Something went wrong!" });
    }
    return res.json(Object.assign(Object.assign({}, image), { url }));
});
exports.default = router;
//# sourceMappingURL=file.js.map