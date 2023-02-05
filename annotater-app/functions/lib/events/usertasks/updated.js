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
function use() {
    return async function onUserTaskUpdated(change, context) {
        const utask = change.after.data();
        if (utask.completed_at > 0)
            return;
        const remain = lodash_1.default.difference(utask.uncompleted_task_image_ids, utask.completed_task_image_ids);
        if (remain.length == 0) {
            await admin
                .firestore()
                .collection(database.COLLECTION_USER_TASKS)
                .doc(utask.id)
                .update({ completed_at: +new Date() })
                .catch((err) => functions.logger.error(err.message));
        }
    };
}
exports.use = use;
//# sourceMappingURL=updated.js.map