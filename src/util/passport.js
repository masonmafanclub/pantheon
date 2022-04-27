import express from "express";
import passport from "passport";
import fetch from "node-fetch";
import "dotenv/config";
import LocalStrategy from "passport-local";

import User from "../db/user";

passport.serializeUser((user, done) => {
  done(null, user.email);
});

passport.deserializeUser((email, done) => {
  User.findOne({ email }, (err, user) => {
    done(err, user);
  });
});

passport.use(
  new LocalStrategy({ usernameField: "email" }, (email, password, done) => {
    console.log("yay/?");
    User.findOne({ email, password }, (err, user) => {
      if (err) return done(err, null);
      if (!user) return done(null, false);
      return done(null, user);
    });
  })
);

export const isAuthenticated = async (req, res, next) => {
  let { logged } = await (
    await fetch(`http://${process.env.THRESH_URL}/islogged`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...req.body, cookie: req.sessionID }),
    })
  ).json();
  if (logged) return next();
  else res.status(401).json({ error: true, description: "not logged in" });
};

export default passport;
