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
exports.useAuthRole = exports.useAuth = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions"));
const database = __importStar(require("./database"));
function useAuth(role = "") {
    return async function auth(req, res, next) {
        const auth = req.get("Authorization");
        if (!auth)
            return res.status(401).json({ error: "unauthorized" });
        const token = auth.split(" ")[1];
        const fuser = await admin
            .auth()
            .verifyIdToken(token)
            .catch((err) => {
            functions.logger.error(err.message);
            return null;
        });
        const uid = (fuser === null || fuser === void 0 ? void 0 : fuser.uid) || "";
        if (!uid)
            return res.status(401).json({ error: "unauthorized" });
        let user = await admin
            .firestore()
            .collection(database.COLLECTION_USERS)
            .doc(uid)
            .get()
            .then((s) => s.data())
            .catch((err) => {
            functions.logger.error(err.message);
            return null;
        });
        if (!user) {
            user = {
                id: uid,
                name: (fuser === null || fuser === void 0 ? void 0 : fuser.displayName) || (fuser === null || fuser === void 0 ? void 0 : fuser.email) || "",
                email: (fuser === null || fuser === void 0 ? void 0 : fuser.email) || "",
                avatar: (fuser === null || fuser === void 0 ? void 0 : fuser.photoURL) || "",
                wallet: (fuser === null || fuser === void 0 ? void 0 : fuser.displayName) || "",
                points: 0,
            };
        }
        if (role)
            user.role = role;
        await admin
            .firestore()
            .collection(database.COLLECTION_USERS)
            .doc(user.id)
            .set(Object.assign(Object.assign({}, user), { token }), { merge: true });
        res.locals.user = user;
        return next();
    };
}
exports.useAuth = useAuth;
function useAuthRole(checkrole = "") {
    return async function authRole(req, res, next) {
        const user = res.locals.user;
        if (!user)
            return res.status(401).json({ error: "unauthorized" });
        if (!!checkrole && user.role !== checkrole) {
            return res.status(401).json({ error: "unauthorized" });
        }
        return next();
    };
}
exports.useAuthRole = useAuthRole;
//# sourceMappingURL=middlewares.js.map