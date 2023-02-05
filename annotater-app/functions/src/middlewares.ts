import { RequestHandler } from "express";
import { ParamsDictionary } from "express-serve-static-core";
import { ParsedQs } from "qs";
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

import * as database from "./database";

export function useAuth(): RequestHandler<
  ParamsDictionary,
  any,
  any,
  ParsedQs,
  any
> {
  return async function auth(req, res, next) {
    const auth = req.get("Authorization");
    if (!auth) return res.status(401).json({ error: "unauthorized" });

    const token = auth.split(" ")[1];
    const fuser = await admin
      .auth()
      .verifyIdToken(token)
      .catch((err) => {
        functions.logger.error(err.message);
        return null;
      });

    const uid = fuser?.uid || "";
    if (!uid) return res.status(401).json({ error: "unauthorized" });

    let user: Partial<database.User> = await admin
      .firestore()
      .collection(database.COLLECTION_USERS)
      .doc(uid)
      .get()
      .then((s) => s.data() as any)
      .catch((err) => {
        functions.logger.error(err.message);
        return null;
      });
    if (!user) {
      user = {
        id: uid,
        name: fuser?.displayName || fuser?.email || "",
        email: fuser?.email || "",
        avatar: fuser?.photoURL || "",
        wallet: fuser?.displayName || "",
        points: 0,
        metadata: {},
      };
    }

    await admin
      .firestore()
      .collection(database.COLLECTION_USERS)
      .doc(String(user.id))
      .set({ ...user, token }, { merge: true });

    res.locals.user = user;

    return next();
  };
}

export function useAuthRole(
  checkrole = ""
): RequestHandler<ParamsDictionary, any, any, ParsedQs, any> {
  return async function authRole(req, res, next) {
    const user: database.User = res.locals.user;
    if (!user) return res.status(401).json({ error: "unauthorized" });

    if (!!checkrole && user.role !== checkrole) {
      return res.status(401).json({ error: "unauthorized" });
    }

    return next();
  };
}
