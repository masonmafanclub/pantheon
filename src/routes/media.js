import express from "express";
import FormData from "form-data";
import multer from "multer";
import fetch from "node-fetch";
import { isAuthenticated } from "../util/auth";

const router = express.Router();

const upload = multer();

// upload
router.post(
  "/upload",
  isAuthenticated,
  upload.single("file"),
  async (req, res) => {
    if (!req.file || !req.file.originalname || !req.file.buffer)
      return res.json({ error: true, description: "invalid file" });

    const form = new FormData();
    form.append("file", req.file.buffer, req.file.originalname);
    let threshres = await (
      await fetch(`http://${process.env.SERAPHINE_URL}/upload`, {
        method: "POST",
        body: form,
      })
    ).json();

    res.json(threshres);
  }
);

// access
router.get("/access/:id", isAuthenticated, async (req, res) => {
  let threshres = await fetch(
    `http://${process.env.SERAPHINE_URL}/access/${req.params.id}`
  );
  if (threshres.status !== 200) res.json(await threshres.json());
  else {
    let blob = await threshres.blob();
    res.set("Content-Type", blob.type);
    res.send(Buffer.from(await blob.arrayBuffer()));
  }
});

export default router;
