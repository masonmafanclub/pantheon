import express from "express";
import passport from "passport";
import crypto from "crypto";

import User from "../db/user";
import sendVerify from "../util/nodemailer";

const router = express.Router();

// signup
router.post("/signup", async (req, res) => {
  if (!req.body.username || !req.body.password || !req.body.email) {
    res.json({ status: "ERROR", msg: "missing info" });
    return;
  }
  if (
    await User.countDocuments({
      $or: [{ username: req.body.username }, { email: req.body.email }],
    })
  ) {
    res.json({ status: "ERROR", msg: "username/email already taken" });
    return;
  }

  // create new user
  const key = crypto.randomBytes(20).toString("hex");
  let user = new User({
    username: req.body.username,
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
router.post("/login", passport.authenticate("local"), (req, res) => {
  res.json({ status: "OK" });
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
