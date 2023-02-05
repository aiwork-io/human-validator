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
exports.prev = exports.next = void 0;
const admin = __importStar(require("firebase-admin"));
const database = __importStar(require("../../database"));
async function next(task, img) {
    const images = await admin
        .firestore()
        .collection(database.COLLECTION_TASK_IMAGES)
        .where("task_id", "==", task.id)
        .where("created_at", ">=", img.created_at)
        .orderBy("created_at", "asc")
        .limit(5)
        .get()
        .then((snapshot) => {
        const tasks = [];
        snapshot.forEach((s) => tasks.push(s.data()));
        return tasks;
    });
    if (!images.length)
        return null;
    for (const image of images) {
        if (image.id !== img.id)
            return image;
    }
    return null;
}
exports.next = next;
async function prev(task, img) {
    const images = await admin
        .firestore()
        .collection(database.COLLECTION_TASK_IMAGES)
        .where("task_id", "==", task.id)
        .where("created_at", "<=", img.created_at)
        .orderBy("created_at", "desc")
        .limit(5)
        .get()
        .then((snapshot) => {
        const tasks = [];
        snapshot.forEach((s) => tasks.push(s.data()));
        return tasks;
    });
    if (!images.length)
        return null;
    for (const image of images) {
        if (image.id !== img.id)
            return image;
    }
    return null;
}
exports.prev = prev;
//# sourceMappingURL=logic.js.map