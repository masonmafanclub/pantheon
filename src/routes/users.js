import express from "express";
import passport from "passport";
import crypto from "crypto";

import User from "../db/user";
import sendVerify from "../util/nodemailer";

const router = express.Router();

// signup
router.post("/signup", async (req, res) => {
  if (!req.body.name || !req.body.password || !req.body.email) {
    res.json({ status: "ERROR", msg: "missing info" });
    return;
  }
  if (await User.countDocuments({ email: req.body.email })) {
    res.json({ status: "ERROR", msg: "email already taken" });
    return;
  }

  // create new user
  const key = crypto.randomBytes(20).toString("hex");
  let user = new User({
    name: req.body.name,
    password: req.body.password,
    email: req.body.email,
    verified: false,
    key,
  });
  await user.save();

  sendVerify(req.body.email, user._id, key);

  res.json({ status: "OK" });
});

// login
router.post("/login", (req, res, next) => {
  passport.authenticate("local", function (err, user, info) {
    if (err) {
      return res.status(401).json({ error: true, description: `err: ${err}` });
    }
    if (!user) {
      return res
        .status(401)
        .json({ error: true, description: "no user found" });
    }
    req.login(user, function (err) {
      if (err) {
        return res.status(401).json({
          error: true,
          description: "actually doomed if this happens",
        });
      }
      if (!user.verified) {
        return res.status(401).json({
          error: true,
          description: "not verified",
        });
      }
      console.log(user)
      return res.status(200).json({ name: user.name });
    });
  })(req, res, next);
});

// logout
router.post("/logout", (req, res) => {
  req.logout();
  res.json({ status: "OK" });
});
router.get("/test", (req, res) => {
  if (!req.session || !req.session.passport) {
    res.send("no session")
  }
  else{
    res.json(req.session.passport)
  }
});

// verify
router.get("/verify", async (req, res) => {
  if (!req.query.id || !req.query.key) {
    res.json({ status: "ERROR", msg: "missing info" });
    return;
  }

  // find and update user
  let userres = await User.updateOne(
    { _id: req.query.id, key: req.query.key, verified: false },
    { verified: true }
  ).exec();
  if (!userres.modifiedCount) {
    res.json({ status: "ERROR", msg: "invalid key/id" });
    return;
  }

  res.json({ status: "OK" });
});

export default router;
