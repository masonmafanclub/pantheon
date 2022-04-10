import express from "express";
import ShareDB from "sharedb";
import richText from "rich-text";

const router = express.Router();

var QuillDeltaToHtmlConverter =
  require("quill-delta-to-html").QuillDeltaToHtmlConverter;

ShareDB.types.register(richText.type);
var backend = new ShareDB();

var connection = backend.connect();
var doc = connection.get("document", "rich-text");
doc.create([], "rich-text");

const clients = new Map();

router.get("/connect/:id", function (req, res, next) {
  console.log(`/connect/${req.params.id} start`);
  const headers = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  };
  res.writeHead(200, headers);
  res.flushHeaders();

  let doc = backend.connect().get("document", "rich-text");
  const client = { res, doc, active: true };
  clients.set(req.params.id, client);
  doc.subscribe((err) => {
    if (err) {
      console.log(e);
      throw err;
    }
    doc.fetch();
    res.write(`data: ${JSON.stringify({ content: doc.data.ops })}`);
    res.write("\n\n");
    console.log(
      `/connect/${req.params.id} data: ${JSON.stringify({
        content: doc.data.ops,
      })}`
    );
    doc.on("op", (op, source) => {
      console.log(`/connect/${req.params.id} incoming changes`);
      if (!source && client.active) {
        res.write(`data: ${JSON.stringify([op])}`);
        res.write("\n\n");
        console.log(`/connect/${req.params.id} data: ${JSON.stringify(op)}`);
      }
    });
  });

  res.on("close", () => {
    console.log(`/connect/${req.params.id} dropped`);
    client.active = false;
    res.end();
  });
});

router.post("/op/:id", function (req, res, next) {
  console.log(`/op/${req.params.id} ${JSON.stringify(req.body)}`);
  const doc = clients.get(req.params.id).doc;
  if (!req.body) return;
  req.body.forEach(function (op) {
    doc.submitOp(op, (e) => {
      if (e) console.log(e);
    });
  });
  res.send("success");
});

router.get("/doc/:id", function (req, res, next) {
  const doc = clients.get(req.params.id).doc;
  var cfg = {};
  doc.fetch();
  var converter = new QuillDeltaToHtmlConverter(doc.data.ops, cfg);
  console.log(`/doc/${req.params.id} ${converter.convert()}`);
  res.send(converter.convert());
});

export default router;
