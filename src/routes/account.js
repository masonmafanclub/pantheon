import express from "express";
import passport from "passport";

import User from "../db/user";

const router = express.Router();

// register
router.post("/register", async (req, res) => {
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
  let user = new User({
    username: req.body.username,
    password: req.body.password,
    email: req.body.email,
    verified: false,
  });
  await user.save();

  res.json({ status: "OK" });
});

// login
router.post("/login", passport.authenticate("local"), (req, res) => {
  res.json({ status: "OK" });
});

// verify
router.put("/verify", async (req, res) => {
  if (!req.body.email) {
    res.json({ status: "ERROR", msg: "missing info" });
    return;
  }

  // find and update user
  let user = User.updateOne({ email: req.body.email }, { verified: true });
  if (!user) {
    res.json({ status: "ERROR", msg: "no such user" });
    return;
  }

  res.json({ status: "OK" });
});

export default router;
