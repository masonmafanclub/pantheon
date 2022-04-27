import express from "express";
import fetch from "node-fetch";
import "dotenv/config";

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
