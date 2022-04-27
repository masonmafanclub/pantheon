import express from "express";

import { backend, docs } from "../sharedb";
import { isAuthenticated } from "../util/auth";
const router = express.Router();

var QuillDeltaToHtmlConverter =
  require("quill-delta-to-html").QuillDeltaToHtmlConverter;

router.get("/connect/:docid/:uid", isAuthenticated, function (req, res, next) {
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
        version: version.val,
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
    clients.delete(uid); // do we do this?
    doc.unsubscribe();
    res.end();
  });
});

router.post("/op/:docid/:uid", isAuthenticated, function (req, res, next) {
  const uid = req.params.uid;
  const docid = req.params.docid;

  const version = docs.get(docid).version;
  const clients = docs.get(docid).clients;
  const doc = clients.get(uid).doc;
  // console.log(`/op/${req.params.id} ${JSON.stringify(req.body)}`);

  if (!req.body) return;
  if (version.equals(req.body.version)) {
    version.inc();
    // Q: is this really inefficient and bad? good
    var newDoc = docs.get(docid);
    newDoc.last_modified = Date.now();
    docs.set(docid, newDoc);
    doc.submitOp(req.body.op);
    res.json({ status: "ok" });
    // client should increment version locally when receives ack
  } else {
    // send retry
    res.json({ status: "retry" });
  }
});

//  body is this{ index, length }
router.post(
  "/presence/:docid/:uid",
  isAuthenticated,
  async function (req, res, next) {
    const uid = req.params.uid;
    const docid = req.params.docid;

    if (!req.body) return;

    const clients = docs.get(docid).clients;
    clients.forEach((client, clientuid) => {
      if (clientuid !== uid) {
        client.res.write(
          `data: ${JSON.stringify({
            presence: {
              id: uid,
              cursor: {
                index: req.body.index,
                length: req.body.length,
                name: req.session.name,
              },
            },
          })}\n\n`
        );
      }
    });

    res.json({}); // unsure if this is desired result
  }
);

router.get("/get/:docid/:uid", isAuthenticated, function (req, res, next) {
  const uid = req.params.uid;
  const docid = req.params.docid;

  const clients = docs.get(docid).clients;
  const doc = clients.get(uid).doc;
  doc.fetch();

  console.log(doc.data.ops);
  var converter = new QuillDeltaToHtmlConverter(doc.data.ops, {});
  console.log(`/doc/${req.params.uid} ${converter.convert()}`);
  res.send(converter.convert());
});

router.get("/edit/:docid", isAuthenticated, function (req, res, next) {
  res.render("edit", { docid: req.params.docid });
});
export default router;
