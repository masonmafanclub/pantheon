import express from "express";
import User from "../db/user";

const router = express.Router();

// delete all users
router.delete("/users", async (req, res) => {
  await User.deleteMany({});
  res.json({ status: "OK" });
});

export default router;
