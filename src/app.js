import express from "express";
import session from "express-session";

import collectionRouter from "./routes/collection";
import usersRouter from "./routes/users";
import mediaRouter from "./routes/media";
import docRouter from "./routes/doc";

var app = express();
app.set("view engine", "ejs");
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: false, limit: "50mb" }));

app.use((req, res, next) => {
  res.setHeader("X-CSE356", "61f9c1e2ca96e9505dd3f7ea");
  next();
});

app.use(
  session({
    secret: "secret",
    resave: false,
    saveUninitialized: true,
  })
);

app.use(function (req, res, next) {
  var fullUrl = req.protocol + "://" + req.get("host") + req.originalUrl;
  console.log(req.method, fullUrl, "body:", req.body);
  next();
});
app.use("/collection", collectionRouter);
app.use("/users", usersRouter);
app.use("/media", mediaRouter);
app.use("/login", function (req, res) {
  res.render("login");
});
app.use("/home", function (req, res) {
  res.render("home");
});
// consider removing the obsolete doc endpoint
app.use("/doc", docRouter);

app.get("/test", function (req, res, next) {
  res.send("Hello World");
});

export default app;
