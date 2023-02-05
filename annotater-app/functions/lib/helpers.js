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
exports.getmostincorrectag = exports.countcorrectpercentage = exports.number = exports.tag = exports.getsignedurl = exports.md5 = exports.unzip = exports.download = void 0;
const crypto_1 = __importDefault(require("crypto"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const node_stream_zip_1 = __importDefault(require("node-stream-zip"));
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions"));
const lodash_1 = __importDefault(require("lodash"));
async function download(url, to) {
    const res = await node_fetch_1.default(url);
    const stream = fs_1.default.createWriteStream(to);
    return new Promise((resolve, reject) => {
        res.body.pipe(stream);
        res.body.on("error", reject);
        stream.on("finish", resolve);
    });
}
exports.download = download;
async function unzip(from, to = "/tmp") {
    return new Promise((resolve, reject) => {
        var zip = new node_stream_zip_1.default({ file: from, storeEntries: true });
        zip.on("error", reject);
        zip.on("ready", async function () {
            const promises = [];
            const entries = zip.entries();
            for (const name of Object.keys(entries)) {
                const entry = entries[name];
                if ("/" === entry.name[entry.name.length - 1])
                    continue;
                promises.push((async () => {
                    const pathname = path_1.default.resolve(to, entry.name);
                    await fs_1.default.promises.mkdir(path_1.default.dirname(pathname), {
                        recursive: true,
                    });
                    await new Promise((rresolve, rreject) => {
                        zip.extract(entry.name, pathname, function (err) {
                            if (err)
                                return rreject(err);
                            return rresolve(true);
                        });
                    });
                    return pathname;
                })());
            }
            await Promise.all(promises).then(resolve).catch(reject);
        });
    });
}
exports.unzip = unzip;
function md5(...items) {
    return crypto_1.default.createHash("md5").update(items.join("/")).digest("hex");
}
exports.md5 = md5;
async function getsignedurl(key) {
    return admin
        .storage()
        .bucket()
        .file(key)
        .getSignedUrl({
        action: "read",
        expires: new Date(+new Date() + 10800000),
    })
        .then(([url]) => ({ url }))
        .catch((error) => {
        functions.logger.error(`[${key}] ${error.message}`);
        return { error, url: "" };
    });
}
exports.getsignedurl = getsignedurl;
function tag(filename) {
    return filename.split(".")[0] || filename;
}
exports.tag = tag;
function number(n) {
    return Number(n) || 0;
}
exports.number = number;
function countcorrectpercentage(i) {
    const total = lodash_1.default.sum(Object.values(i.answer_hash));
    if (total === 0)
        return Number(0).toFixed(2);
    return Number(((number(i.answer_correct) * 100) / total).toFixed(2));
}
exports.countcorrectpercentage = countcorrectpercentage;
function getmostincorrectag(i) {
    const maps = Object.keys(i.answer_incorrect_hash).map((key) => ({
        key,
        value: i.answer_incorrect_hash[key],
    }));
    const top = lodash_1.default.takeRight(lodash_1.default.sortBy(maps, "key"), 5);
    return top.map((i) => i.key).join(", ");
}
exports.getmostincorrectag = getmostincorrectag;
//# sourceMappingURL=helpers.js.map