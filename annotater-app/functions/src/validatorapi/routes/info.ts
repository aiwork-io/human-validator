import { Router } from "express";

import * as constants from "../../constants";

const router = Router();

router.get("/", async function index(req, res) {
  const data: { [name: string]: any } = {
    ip: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
    location: constants.PROJECT_LOCATION,
  };

  res.json(data);
});

export default router;
