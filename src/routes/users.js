import express from "express";
import passport from "passport";
import crypto from "crypto";
import fetch from "node-fetch";
import { isAuthenticated } from "../util/passport";
import "dotenv/config";

import User from "../db/user";
import sendVerify from "../util/nodemailer";

const router = express.Router();

// signup
router.post("/signup", async (req, res) => {
  let threshres = await (
    await fetch(`http://${process.env.THRESH_URL}/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...req.body, verified: true }),
    })
  ).json();

  res.json(threshres);
});

// login
router.post("/login", async (req, res) => {
  let threshres = await (
    await fetch(`http://${process.env.THRESH_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...req.body, cookie: req.sessionID }),
    })
  ).json();

  res.json(threshres);
});

// logout
router.post("/logout", async (req, res) => {
  let threshres = await (
    await fetch(`http://${process.env.THRESH_URL}/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ cookie: req.sessionID }),
    })
  ).json();

  res.json(threshres);
});

// verify
router.get("/verify", async (req, res) => {
  if (!req.query.id || !req.query.key)
    return res.json({ error: true, description: "missing info" });

  let threshres = await (
    await fetch(`http://${process.env.THRESH_URL}/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ key: req.query.key, id: req.query.id }),
    })
  ).json();

  res.json(threshres);
});

// check
router.get("/check", isAuthenticated, async (req, res) => {
  res.json({ status: "OK" });
});

export default router;
