import express from "express";
import axios from "axios";
import { isAuthenticated } from "../auth";
import { naut_url } from "../upstream";

const router = express.Router();

const { Client } = require("@elastic/elasticsearch");

const elastic = new Client({
  cloud: {
    id: process.env.CLOUD_ID,
  },
  auth: {
    apiKey: process.env.ENCODED_API_KEY,
  },
});

router.get("/search", isAuthenticated, async (req, res) => {
  const result = await elastic.search({
    index: "cse356",
    query: {
      multi_match: {
        query: req.query.q,
        type: "phrase",
        fields: ["name^2", "text"],
      },
    },
    highlight: {
      fields: {
        text: {},
      },
      number_of_fragments: 1,
      fragment_size: 500,
      type: "plain"
    },
  });
  if (result.hits.hits) {
    const output = result.hits.hits.map((hit) => ({
      docid: hit._id,
      name: hit._source.name,
      snippet: hit.highlight.text[0],
    }));
    return res.status(200).json(output);
  } else {
    return res.status(200).json([]);
  }
});

router.get("/suggest", isAuthenticated, async (req, res) => {
  const result = await elastic.search({
    index: "cse356",
    suggest: {
      suggestion: {
        text: req.query.q,
        term: {
          field: "suggest",
          prefix_length: req.query.q.length,
        },
      },
    },
  });
  console.log(result.suggest);
  if (
    result.suggest.suggestion.length > 0 &&
    result.suggest.suggestion[0].options.length > 0
  ) {
    const output = result.suggest.suggestion[0].options.map(
      (option) => option.text
    );
    return res.status(200).json(output);
  } else {
    return res.status(200).json([]);
    // return res.status(400).json({ status: "no suggestions" });
  }
});

export default router;
