import express from "express";
import crypto from "crypto";
import { backend, docs } from "../sharedb";
import { isAuthenticated } from "../util/auth";

const router = express.Router();

// fancy wrapper around integer
class Version {
  constructor() {
    this.val = 0;
  }
  equals(other) {
    return this.val == other;
  }
  inc() {
    this.val++;
  }
}

router.post("/create", isAuthenticated, function (req, res, next) {
  if (!req.body.name) {
    return res.status(400).json({ status: "error" });
  }
  const docid = crypto.randomBytes(20).toString("hex");

  var doc = backend.connect().get("document", docid);
  doc.create([], "rich-text");
  docs.set(docid, {
    version: new Version(),
    name: req.body.name,
    clients: new Map(),
    last_modified: Date.now(),
    // presence: []; // todo figure this out
  });

  return res.status(200).json({ docid });
});

router.post("/delete", isAuthenticated, function (req, res, next) {
  console.log(req.body.name);
  if (!req.body.name) {
    return res.status(400).json({ status: "error" });
  }
  const docid = req.body.name;

  var doc = backend.connect().get("document", docid);
  doc.destroy();

  docs.delete(docid);

  return res.status(200).json({});
});

router.get("/list", isAuthenticated, function (req, res, next) {
  // sort by lastmodified
  var sortedDocs = Array.from(docs.keys()).sort(
    (a, b) => docs.get(b).last_modified - docs.get(a).last_modified
  );
  var retVal = sortedDocs
    .slice(0, 10)
    .map((docid) => ({ id: docid, name: docs.get(docid).name }));
  res.json(retVal);
});

export default router;
