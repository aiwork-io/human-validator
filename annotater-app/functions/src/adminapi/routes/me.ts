import { Router } from "express";
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

import * as database from "../../database";

const router = Router();

router.get("/", async function create(req, res) {
  const user: database.User = res.locals.user;
  return res.json(user);
});

router.post("/", async function create(req, res) {
  const user: database.User = res.locals.user;
  const body: { wallet: string } = req.body as any;

  if (!body.wallet) {
    return res.status(400).json({ error: "wallet address could not be blank" });
  }

  user.wallet = body.wallet.toLowerCase();
  await admin
    .firestore()
    .collection(database.COLLECTION_USERS)
    .doc(user.id)
    .set(user, { merge: true })
    .catch((err) => functions.logger.error(`[${user.id}] ${err.message}`));

  return res.json(user);
});

export default router;
