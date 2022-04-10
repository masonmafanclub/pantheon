// import createError from "http-errors";
import express from "express";
import logger from "morgan";
import cookieParser from "cookie-parser";
import cors from "cors";

import router from "./routes/sharedb";

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

app.use(router);

app.get("/test", function (req, res, next) {
  res.send("Hello World");
});

// // catch 404 and forward to error handler
// app.use(function (req, res, next) {
//   next(createError(404));
// });

// // error handler
// app.use(function (err, req, res, next) {
//   // set locals, only providing error in development
//   res.locals.message = err.message;
//   res.locals.error = req.app.get("env") === "development" ? err : {};

//   // render the error page
//   res.status(err.status || 500);
//   res.send(err);
// });

export default app;
