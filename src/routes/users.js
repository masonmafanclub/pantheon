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
router.post("/login", passport.authenticate("local"), async (req, res) => {
  var user = await User.findOne({ email: req.session.passport.user });
  res.json({ username: user.username });
});

// logout
router.post("/logout", (req, res) => {
  req.logout();
  res.json({ status: "OK" });
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
