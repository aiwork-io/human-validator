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
exports.use = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions"));
const database = __importStar(require("../../database"));
function use() {
    return async function OnUserCreated(r) {
        const user = {
            id: r.uid,
            name: r.displayName || r.email || "",
            email: r.email || "",
            avatar: r.photoURL || "",
            wallet: r.displayName || "",
            points: 0,
        };
        await admin
            .firestore()
            .collection(database.COLLECTION_USERS)
            .doc(user.id)
            .set(user, { merge: true })
            .catch((err) => functions.logger.error(`[${user.id}/${user.name}] ${err.message}`));
        functions.logger.info(`[${user.id}] created`);
    };
}
exports.use = use;
//# sourceMappingURL=created.js.map