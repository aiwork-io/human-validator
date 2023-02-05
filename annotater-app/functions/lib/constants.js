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
var _a, _b, _c, _d, _e, _f;
Object.defineProperty(exports, "__esModule", { value: true });
exports.USER_ID = exports.ADMIN_ID = exports.FOLDER_TASK_IMAGE = exports.FOLDER_TASK_ZIP = exports.PROJECT_LOCATION = exports.BUCKET_NAME = void 0;
const functions = __importStar(require("firebase-functions"));
exports.BUCKET_NAME = ((_a = functions.config().storage) === null || _a === void 0 ? void 0 : _a.bucket) || "aiworklabletool.appspot.com";
exports.PROJECT_LOCATION = ((_b = functions.config().storage) === null || _b === void 0 ? void 0 : _b.location) || "asia-southeast1";
exports.FOLDER_TASK_ZIP = ((_d = (_c = functions.config().folders) === null || _c === void 0 ? void 0 : _c.task) === null || _d === void 0 ? void 0 : _d.zip) || "task_zip";
exports.FOLDER_TASK_IMAGE = ((_f = (_e = functions.config().folders) === null || _e === void 0 ? void 0 : _e.task) === null || _f === void 0 ? void 0 : _f.images) || "task_images";
exports.ADMIN_ID = "2391b819-170b-4873-9ba0-6ecbda589a64";
exports.USER_ID = "64dfda53-4fb7-4464-9512-e27b4d8f2ffe";
//# sourceMappingURL=constants.js.map