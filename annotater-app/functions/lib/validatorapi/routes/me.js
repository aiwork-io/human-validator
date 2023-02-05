"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = express_1.Router();
router.get("/", async function create(req, res) {
    const user = res.locals.user;
    return res.json(user);
});
exports.default = router;
//# sourceMappingURL=me.js.map