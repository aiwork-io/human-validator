import { Router } from "express";

import * as database from "../../database";

const router = Router();

router.get("/", async function create(req, res) {
  const user: database.User = res.locals.user;
  return res.json(user);
});

export default router;
