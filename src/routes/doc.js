import express from "express";
import EventSource from "eventsource";
import axios from "axios";

import { isAuthenticated } from "../auth";

const router = express.Router();

router.get("/connect/:docid/:uid", isAuthenticated, (req, res) => {
  const { uid, docid } = req.params;

  const headers = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  };
  res.writeHead(200, headers);
  res.flushHeaders();

  const eventSource = new EventSource(
    `http://${process.env.NAUTILUS_URL}/doc/connect/${docid}/${uid}`
  );

  eventSource.onmessage = (e) => {
    console.log(`received data: ${e.data}`);
    res.write(`data: ${e.data}`);
    res.write("\n\n");
  };

  res.on("close", () => {
    console.log(`/connect/${docid} dropped`);
    eventSource.close();
    res.end();
  });
});

router.post("/op/:docid/:uid", isAuthenticated, (req, res, next) => {
  const { uid, docid } = req.params;
  axios({
    method: "post",
    url: `http://${process.env.NAUTILUS_URL}/doc/op/${docid}/${uid}`,
    data: req.body,
  })
    .then((nautres) => {
      res.status(200).json(nautres.data);
    })
    .catch((nauterr) => {
      res.status(400).json(nauterr.response.data);
    });
});

router.post("/presence/:docid/:uid", isAuthenticated, (req, res) => {
  const { uid, docid } = req.params;
  axios({
    method: "post",
    url: `http://${process.env.NAUTILUS_URL}/doc/presence/${docid}/${uid}`,
    data: { ...req.body, name: req.session.name }, // TODO : REPLACE HI WITH ACTUAL NAME
  })
    .then((nautres) => {
      res.status(200).json(nautres.data);
    })
    .catch((nauterr) => {
      res.status(400).json(nauterr.response.data);
    });
});

router.get("/get/:docid/:uid", isAuthenticated, (req, res) => {
  const { uid, docid } = req.params;
  axios({
    method: "get",
    url: `http://${process.env.NAUTILUS_URL}/doc/get/${docid}/${uid}`,
  })
    .then((nautres) => {
      res.status(200).json(nautres.data);
    })
    .catch((nauterr) => {
      res.status(400).json(nauterr.response.data);
    });
});

router.get("/edit/:docid", isAuthenticated, function (req, res, next) {
  res.render("edit", { docid: req.params.docid });
});
export default router;
