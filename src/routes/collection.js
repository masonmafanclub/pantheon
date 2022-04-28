import express from "express";
import crypto from "crypto";
import axios from "axios";
import { isAuthenticated } from "../auth";

const router = express.Router();

router.post("/create", isAuthenticated, (req, res, next) => {
  const docid = crypto.randomBytes(20).toString("hex");

  axios({
    method: "post",
    url: `http://${process.env.NAUTILUS_URL}/collection/create`,
    data: {
      name: req.body.name,
      docid,
    },
  })
    .then((nautres) => {
      res.status(200).json({ docid });
    })
    .catch((nauterr) => {
      res.status(400).json(nauterr.response.data);
    });
});

router.post("/delete", isAuthenticated, (req, res, next) => {
  const docid = req.body.name;

  axios({
    method: "post",
    url: `http://${process.env.NAUTILUS_URL}/collection/delete`,
    data: { docid },
  })
    .then((nautres) => {
      res.status(200).json({});
    })
    .catch((nauterr) => {
      res.status(400).json(nauterr.response.data);
    });
});

router.get("/list", isAuthenticated, (req, res, next) => {
  axios({
    method: "get",
    url: `http://${process.env.NAUTILUS_URL}/collection/list`,
  }).then((nautres) => {
    res.status(200).json(nautres.data);
  });
});

export default router;
