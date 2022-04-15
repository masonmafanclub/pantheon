import express from "express";

import { backend, docs } from "../sharedb";

const router = express.Router();

var QuillDeltaToHtmlConverter =
  require("quill-delta-to-html").QuillDeltaToHtmlConverter;

router.get("/connect/:docid/:uid", function (req, res, next) {
  const uid = req.params.uid;
  const docid = req.params.docid;

  if (!docs.has(docid)) {
    res.status(400).json({ status: "error no doc exists" });
  }

  console.log(`/connect/${req.params.docid}/${req.params.uid} start`);
  const headers = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  };
  res.writeHead(200, headers);
  res.flushHeaders();

  const version = docs.get(docid).version;
  const clients = docs.get(docid).clients;

  if (!clients.has(uid)) {
    clients.set(uid, {
      res,
      doc: backend.connect().get("document", docid),
    });
  }
  const doc = clients.get(uid).doc;

  // each client should have their own connection
  // "The EventStream should send messages in the form {content, version}, {presence}, {ack}, or a delta op"
  // {presence {id:, cursor: {index, length, name}}} or {presence:{id:, cursor: null}}
  // ack =
  // presence.subscribe((err) => {
  //   if (err) {
  //     console.log(err);
  //     throw err;
  //   }
  //   presence.on("receive", (id, value) => {
  //     console.log(
  //       `wrote data: ${JSON.stringify({ presence: { id: id, cursor: value } })}`
  //     );
  //     res.write(
  //       `data: ${JSON.stringify({ presence: { id: id, cursor: value } })}`
  //     );
  //   });
  // });

  doc.subscribe((err) => {
    if (err) throw err;

    doc.fetch();
    res.write(
      `data: ${JSON.stringify({
        content: doc.data.ops,
        // version: version.val(),
      })}`
    );
    res.write("\n\n");
    // console.log(
    //   `/connect/${req.params.docid}/${req.params.uid} data: ${JSON.stringify({
    //     content: doc.data.ops,
    //   })}`
    // );
    doc.on("op", (op, source) => {
      // console.log(`/connect/${req.params.id} incoming changes`);
      if (source) {
        res.write(`data: ${JSON.stringify({ ack: op })}`);
        res.write("\n\n");
      } else {
        res.write(`data: ${JSON.stringify(op)}`);
        res.write("\n\n");
        // console.log(`/connect/${req.params.id} data: ${JSON.stringify(op)}`);
      }
    });
  });

  res.on("close", () => {
    console.log(`/connect/${req.params.id} dropped`);
    // presence.unsubscribe(); // is this the same docPresence for everyone? idk :O
    doc.unsubscribe();
    res.end();
  });
});

router.post("/op/:docid/:uid", function (req, res, next) {
  const uid = req.params.uid;
  const docid = req.params.docid;

  const version = docs.get(docid).version;
  const clients = docs.get(docid).clients;
  const doc = clients.get(uid).doc;
  // console.log(`/op/${req.params.id} ${JSON.stringify(req.body)}`);

  if (!req.body) return;
  if (version.equals(req.body.version)) {
    version.inc();
    doc.submitOp(req.body.op);
    res.json({ status: "ok" });
    // client should increment version locally when receives ack
  } else {
    // send retry
    res.json({ status: "retry" });
  }
});

router.post("/presence/:docid:uid", function (req, res, next) {
  // console.log(`/op/${req.params.id} ${JSON.stringify(req.body)}`);
  const localpresence = clients
    .get(req.params.uid)
    .getDocPresence(collection, req.params.docid)
    .create(); // we want to use uid
  if (!req.body) return;
  localpresence.submit(req.body); // hoping this format is fine as is without sanitization and stuff
  res.json({}); // unsure if this is desired result
});

router.get("/doc/:id", function (req, res, next) {
  console.log(doc1.data.ops);
  const doc = clients.get(req.params.id).doc;
  var cfg = {};
  // doc.fetch();
  console.log(doc.data.ops);
  var converter = new QuillDeltaToHtmlConverter(doc.data.ops, cfg);
  console.log(`/doc/${req.params.id} ${converter.convert()}`);
  res.send(converter.convert());
});

router.get("/edit/:docid", function (req, res, next) {
  res.render("edit", { docid: req.params.docid });
});
export default router;
