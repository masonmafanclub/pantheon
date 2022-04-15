import express from "express";

import { backend, docs } from "../sharedb";

const router = express.Router();

// fancy wrapper around integer
class Version {
  constructor() {
    this.val = 0;
  }
  val() {
    return this.val;
  }
  equals(other) {
    return this.val == other;
  }
  inc() {
    this.val++;
  }
}

router.post("/create", function (req, res, next) {
  if (!req.body.name) {
    return res.status(400).json({ status: "error" });
  }
  const docid = req.body.name;

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

router.post("/delete", function (req, res, next) {
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

router.get("/list", function (req, res, next) {
  res.send("todo");
});

export default router;
