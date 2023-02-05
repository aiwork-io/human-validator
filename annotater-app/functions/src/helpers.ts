import crypto from "crypto";
import path from "path";
import fs from "fs";
import fetch from "node-fetch";
import Zip from "node-stream-zip";
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

import _ from "lodash";

export async function download(url: string, to: string) {
  const res = await fetch(url);
  const stream = fs.createWriteStream(to);
  return new Promise((resolve, reject) => {
    res.body.pipe(stream);
    res.body.on("error", reject);
    stream.on("finish", resolve);
  });
}

export async function unzip(from: string, to = "/tmp"): Promise<string[]> {
  return new Promise((resolve, reject) => {
    var zip = new Zip({ file: from, storeEntries: true });

    zip.on("error", reject);
    zip.on("ready", async function () {
      const promises: Array<Promise<string>> = [];

      const entries = zip.entries();
      for (const name of Object.keys(entries)) {
        const entry = entries[name];
        if ("/" === entry.name[entry.name.length - 1]) continue;

        promises.push(
          (async (): Promise<string> => {
            const pathname = path.resolve(to, entry.name);
            await fs.promises.mkdir(path.dirname(pathname), {
              recursive: true,
            });

            await new Promise((rresolve, rreject) => {
              zip.extract(entry.name, pathname, function (err) {
                if (err) return rreject(err);
                return rresolve(true);
              });
            });

            return pathname;
          })()
        );
      }

      await Promise.all(promises).then(resolve).catch(reject);
    });
  });
}

export function md5(...items: string[]) {
  return crypto.createHash("md5").update(items.join("/")).digest("hex");
}

export async function getsignedurl(
  key: string
): Promise<{ error?: Error; url: string }> {
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

export function tag(filename: string) {
  return filename.split(".")[0] || filename;
}

export function number(n: any): number {
  return Number(n) || 0;
}
