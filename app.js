var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var ShareDB = require("sharedb");
var richText = require("rich-text");
var cors = require("cors");
const { map } = require("sharedb/lib/types");
var QuillDeltaToHtmlConverter =
  require("quill-delta-to-html").QuillDeltaToHtmlConverter;

ShareDB.types.register(richText.type);
var backend = new ShareDB();

var connection = backend.connect();
var doc = connection.get("document", "rich-text");
doc.create([], "rich-text");

var app = express();

app.use(cors({ origin: "*" }));

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

const clients = new Map();

app.get("/connect/:id", function (req, res, next) {
  const headers = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  };
  res.writeHead(200, headers);
  res.flushHeaders();

  let doc = backend.connect().get("document", "rich-text");
  doc.subscribe((err) => {
    if (err) throw err;
    res.write(JSON.stringify({ data: doc.data }));
    console.log("subscribed " + req.params.id);
    doc.on("op", function (op) {
      // if (!source) {
      res.write("event: message\n"); // added these
      res.write(`data: ${JSON.stringify({ data: op })}`);
      res.write("\n\n");
      console.log(
        "written: " + req.params.id + " " + JSON.stringify({ data: op })
      );
      // }
    });
  });
  res.on("close", () => {
    console.log("dropped " + req.params.id);
    clients.delete(req.params.id);
    doc.unsubscribe();
    res.end();
  });

  clients.set(req.params.id, { res, doc });
});

app.post("/op/:id", function (req, res, next) {
  console.log("op " + req.params.id);
  const doc = clients.get(req.params.id).doc;
  console.log(doc.data);
  if (!req.body) return;
  req.body.forEach(function (op) {
    doc.submitOp(op);
  });
  res.send("yay");
});

app.get("/doc/:id", function (req, res, next) {
  const doc = clients.get(req.params.id).doc;
  var cfg = {};
  doc.fetch();
  console.log("doc.data: " + JSON.stringify(doc.data));
  var converter = new QuillDeltaToHtmlConverter(doc.data.ops, cfg);
  console.log("doc.data: " + converter.convert());
  res.send(converter.convert());
});

app.get("/test", function (req, res, next) {
  res.send("Hello World");
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.send(err);
});

module.exports = app;
