import express from "express";
import passport from "passport";
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

export const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ error: true, description: "not logged in" });
};

export default passport;
