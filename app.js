var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var ShareDB = require("sharedb");
var richText = require("rich-text");
var cors = require("cors");
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

app.use((req, res, next) => {
  res.setHeader("X-CSE356", "61f9c1e2ca96e9505dd3f7ea");
  next();
});

const clients = new Map();

app.get("/connect/:id", function (req, res, next) {
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

app.post("/op/:id", function (req, res, next) {
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

app.get("/doc/:id", function (req, res, next) {
  const doc = clients.get(req.params.id).doc;
  var cfg = {};
  doc.fetch();
  var converter = new QuillDeltaToHtmlConverter(doc.data.ops, cfg);
  console.log(`/doc/${req.params.id} ${converter.convert()}`);
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
