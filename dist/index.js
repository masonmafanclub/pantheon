"use strict";

var _http = _interopRequireDefault(require("http"));

var _app = _interopRequireDefault(require("./app"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var server = _http.default.createServer(_app.default);

server.listen(3000);
server.on("error", onError);
server.on("listening", onListening);

function onError(error) {
  throw error;
}

function onListening() {
  var addr = server.address();
  var bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
  console.log("Listening on " + bind);
}