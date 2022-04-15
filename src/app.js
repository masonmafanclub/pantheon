import express from "express";
import session from "express-session";
import cors from "cors";

import passport from "./util/passport";
import adminRouter from "./routes/admin";
import usersRouter from "./routes/users";
import mediaRouter from "./routes/media";
import docRouter from "./routes/doc";

var app = express();
app.set('view engine', 'ejs');
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use((req, res, next) => {
  res.setHeader("X-CSE356", "61f9c1e2ca96e9505dd3f7ea");
  next();
});

app.use(
  session({
    secret: "fyi the fields below are required idk what they do",
    resave: false,
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/admin", adminRouter);
app.use("/users", usersRouter);
app.use("/media", mediaRouter);
app.use("/home", function (req, res) {
  res.render('home');
});
// consider removing the obsolete doc endpoint
app.use("/doc", docRouter);

app.get("/test", function (req, res, next) {
  res.send("Hello World");
});

export default app;
