import express from "express";
import axios from "axios";
import { isAuthenticated } from "../auth";

const router = express.Router();

router.get("/search", isAuthenticated, (req, res) => {
  axios({
    method: "get",
    url: `http://${process.env.NAUTILUS_URL}/index/search?q=${req.query.q}`,
  })
    .then((nautres) => {
      res.status(200).json(nautres.data);
    })
    .catch((nauterr) => {
      res.status(400).json(nauterr.response.data);
    });
});

router.get("/suggest", isAuthenticated, (req, res) => {
  axios({
    method: "get",
    url: `http://${process.env.NAUTILUS_URL}/index/suggest?q=${req.query.q}`,
  })
    .then((nautres) => {
      res.status(200).json(nautres.data);
    })
    .catch((nauterr) => {
      res.status(400).json(nauterr.response.data);
    });
});

export default router;
