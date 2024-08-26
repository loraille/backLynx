var express = require("express");
var router = express.Router();
const mongoose = require("mongoose");

const Category = require("../models/categories");
const Artwork = require("../models/artworks");
const { checkBody } = require("../modules/checkBody");

/////// get catégories infos//////////////////////////////////
router.get("/", (req, res) => {
  Category.find().then((categories) => {
    console.log("#Number of categories", categories.length);
    res.json({
      categories,
    });
  });
});

module.exports = router;
