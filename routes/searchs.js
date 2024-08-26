var express = require("express");
var router = express.Router();
const mongoose = require("mongoose");

const Artwork = require("../models/artworks");
const Tag = require("../models/tags");
const User = require("../models/users");

///////////////////search artworks with inside//////////////////////////////////////////
router.get("/artworks", async (req, res) => {
  const query = req.query.title;
  if (!query) {
    return res
      .status(400)
      .json({ error: 'Query parameter "title" is required' });
  }
  try {
    // Rechercher les oeuvres d'art dont le titre contient le texte spécifiée
    const results = await Artwork.find({
      title: { $regex: query, $options: "i" },
    });

    res.json(results);
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while fetching artworks" });
  }
});
//search artworks with tag begin by////////////////////////////////////////////////
router.get("/tags", async (req, res) => {
  const query = req.query.tag;
  if (!query) {
    return res.status(400).json({ error: 'Query parameter "tag" is required' });
  }

  try {
    // search tag begin with
    const tags = await Tag.find({
      name: { $regex: `^${query}`, $options: "i" },
    });

    //extract id
    const tagIds = tags.map((tag) => tag._id);

    // search artworks with tag id
    const results = await Artwork.find({
      tags: { $in: tagIds },
    });

    res.json(results);
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while fetching artworks" });
  }
});

/////////////////search artists with ////////////////////////////////////////////////
router.get("/artists", async (req, res) => {
  const query = req.query.username;
  if (!query) {
    return res
      .status(400)
      .json({ error: 'Query parameter "username" is required' });
  }
  try {
    // search user contain
    const results = await User.find({
      username: { $regex: query, $options: "i" },
    });

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: "An error occurred while fetching users" });
  }
});

module.exports = router;
