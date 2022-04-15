import express from "express";
import ShareDB from "sharedb";
import richText from "rich-text";

const router = express.Router();

var QuillDeltaToHtmlConverter =
  require("quill-delta-to-html").QuillDeltaToHtmlConverter;

ShareDB.types.register(richText.type);
var backend = new ShareDB();

var connection = backend.connect();
var collection = "document"
var doc = connection.get(collection, "rich-text");
doc.create([], "rich-text");

const clients = new Map();
const versions = new Map();

router.get("/connect/:docid/:uid", function (req, res, next) {
  console.log(`/connect/${req.params.id} start`);
  const headers = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  };
  res.writeHead(200, headers);
  res.flushHeaders();
  
  if (clients.has(req.params.uid)){
    connection = clients[req.params.uid].connection
  }
  else{
    let connection = backend.connect()
    const client = { res, connection, active: true };
    clients.set(req.params.uid, client); 
  }
  let doc = connection.get(collection, req.params.docid);
  let docPresence = connection.getDocPresence(collection, req.params.docid);

  if(!versions.has(req.params.docid)){
    // create new doc, set version to 0
    versions.set(req.params.docid,0)
    doc.create([], "rich-text");
  }
    
  // each client should have their own connection
  // "The EventStream should send messages in the form {content, version}, {presence}, {ack}, or a delta op"
  // {presence {id:, cursor: {index, length, name}}} or {presence:{id:, cursor: null}}
  // ack = 
  docPresence.subscribe((err) =>{
    if (err) {
      console.log(err);
      throw err;
    }
    docPresence.on("receive", (id, value) => {
      console.log(`wrote data: ${JSON.stringify({ presence: {id: id, cursor: value}})}`)
      res.write(`data: ${JSON.stringify({ presence: {id: id, cursor: value}})}`)
    })
  })
  doc.subscribe((err) => {
    if (err) {
      console.log(err);
      throw err;
    }
    doc.fetch();
    res.write(`data: ${JSON.stringify({ content: doc.data.ops, version: versions.get(req.params.docid)})}`);
    res.write("\n\n");
    console.log(
      `/connect/${req.params.docid}/${req.params.uid} data: ${JSON.stringify({
        content: doc.data.ops,
      })}`
    );
    doc.on("op", (op, source) => {
      // console.log(`/connect/${req.params.id} incoming changes`);
      if (source) {
        res.write(`data: ${JSON.stringify({ack: op})}`);
        res.write("\n\n");
      }
      else{
        res.write(`data: ${JSON.stringify(op)}`);
        res.write("\n\n");
        // console.log(`/connect/${req.params.id} data: ${JSON.stringify(op)}`);
      }
    });
  });

  res.on("close", () => {
    console.log(`/connect/${req.params.id} dropped`);
    // client.active = false;
    docPresence.unsubscribe(); // is this the same docPresence for everyone?
    doc.unsubscribe();
    res.end();
  });
});

router.post("/op/:docid:uid", function (req, res, next) {
  // console.log(`/op/${req.params.id} ${JSON.stringify(req.body)}`);
  const doc = clients.get(req.params.uid).get(collection,req.params.docid);
  if (!req.body) return;
  if (req.body.version == versions.get(req.params.docid)){
    versions.set(req.params.docid, versions.get(req.params.docid) + 1)
    doc.submitOp()
    res.json({status: 'ok'});
    // client should increment version locally when receives ack
  }
  else{
    // send retry
    res.json({status: 'retry'})
  }
  
});

router.post("/presence/:docid:uid", function (req, res, next) {
  // console.log(`/op/${req.params.id} ${JSON.stringify(req.body)}`);
  const localpresence = clients.get(req.params.uid).getDocPresence(collection,req.params.docid).create();// we want to use uid 
  if (!req.body) return;
  localpresence.submit(req.body) // hoping this format is fine as is without sanitization and stuff
  res.json({}); // unsure if this is desired result
  }
  
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
  res.render('edit', {docid: req.params.docid})
});
export default router;
