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
// var router = require('./routes/index');
// doc.create([{insert: 'Hi!'}],'richtext')
doc.create([{ insert: "Hi!" }], "rich-text");
var app = express();

app.use(express.static("static"));

app.use(cors({ origin: "*" }));

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// router.get('/', function(req, res, next) {
//   res.render('index', { title: 'Express' });
// });

// /connect/:id
// Open a unique connection for the id,
// Create a persistent document (if one does not exist),
// And start receiving an http event stream as a response

// The server will send ‘message’ events in the stream when any connected user modifies the document.
// Contents of the message events:
// First message event should be emitted after the connection is established with format `{data: {content: oplist}}` where the ops here must represent the whole operation array for the whole document initially.
//  Subsequent message events should be emitted on changes to the document from users `{data: array_of_oplists}`
// Ops is the array of rich-text type OT transformations (retain, insert, delete).  The operations should support “bold” and “italics” attributes.

app.get("/connect/:id", function (req, res, next) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  var client_connection = backend.connect();
  var client_doc = client_connection.get("document", "rich-text");

  var count = 0;
  client_doc.subscribe(function (err) {
    if (err) throw err;
    console.log("HERE FIRST");
    res.write(JSON.stringify({ data: client_doc.data }));
    console.log("HERE SECOND");
    client_doc.on("op", function (op, source) {
      res.write(JSON.stringify({ data: op }));
      count++;
      console.log("written: " + JSON.stringify({ data: op }));
    });
  });

  // let counter = 0;
  //   let intervalID = setInterval(() => {
  //       counter++;
  //       if (counter >= 10) {
  //           clearInterval(intervalID);
  //           res.end(); // terminates SSE session
  //           return;
  //       }
  //   }, 1000);

  res.on("finish", () => {
    client_doc.unsubscribe();
    console.log("finish");
  });
  res.on("close", () => {
    console.log("client dropped me");
    res.end();
  });
});

// /op/:id
// Type : POST
// Sample Payload :
// [
// [{'retain': 5}, {'insert': 'a'}],
// [{'retain': 4}, {'delete': 10}],
// [{'insert': “Hello”, 'attributes': {'bold': true}}]
// ]j
// [[{"retain": 5}, {"insert": "a"}], [{"insert": "Hello", "attributes": {"bold": true}}] ]
app.post("/op/:id", function (req, res, next) {
  console.log("oof");
  if (!req.body) return;
  req.body.forEach(function (op) {
    console.log(op);
    doc.submitOp(op);
  });
  doc.whenNothingPending(function () {
    console.log("trying to end");
    res.end();
  });
  // res.end()
  // res.render('index', { title: 'Express' });
});

// /doc/:id
// Type : GET
//  API returns html response
// Response : Whole_document_contents_as_HTML

// HTML format:
// Enclose the doc contents in <p>...</p>
// Use <br /> for line breaks
// Use <strong>...</strong> for bold
// Use <em>..</em> for italics
app.get("/doc/:id", function (req, res, next) {
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
