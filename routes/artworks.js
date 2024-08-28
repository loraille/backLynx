var express = require("express");
var router = express.Router();
const mongoose = require("mongoose");

const cloudinary = require("cloudinary").v2;
const fs = require("fs");

const Artwork = require("../models/artworks");
const User = require("../models/users");
const Tag = require("../models/tags");
const { checkBody } = require("../modules/checkBody");

// Notes on comments
// * when someone add a comment:  update existing document means router.put with a mongo update : NewArtwork.UpdateOne()
// * when displaying Artwork details (see Miro screen 5):

// POST route
// create one artwork. No bulk import, even we accept n files during upload, files will be stored in ./tmp and uuploaded
// to cloudinary 1 by  1
//

router.post("/upload", async (req, res) => {
  /* FIXED (main issues)
     DEBUG  req.body : null  then  body : [object Object] 
     can remove this after completing user part and tags and delete cloudy 
     if (req.files) { console.log("####### req.files"); console.log(req.files);}
     if (req.body)  { console.log("####### req.body " ); console.log((req.body.artworkdetails));}
     console.log("FIN du test #################################################################")
    */

  /* FIXED ok:
       debug express-fileupload req.files 
       res.json({message:"Alors ça te plaît ce que tu vois dans la console?"})
       return;
   */
  // we want req.files and req.body
  if (
    !checkBody(req.files, ["imageFromFront"]) ||
    !checkBody(req.body, [
      "title",
      "description",
      "category",
      "collection",
      "uploader",
    ])
  ) {
    res.json({ result: false, error: "Missing or empty fields" });
    console.log(
      "Check  body, required fields: title,description,category. check also req.filename"
    );
    return;
  }
  console.log(
    "#######File ready to move under ./tmp and upload to Cloudinary:",
    req.files.imageFromFront
  );
  // TODO: check extension  use modules/genfilename(original filename)  return filename to use.
  const artworkPath = `/tmp/${req.files.imageFromFront.name}`;
  const resultMove = await req.files.imageFromFront.mv(artworkPath);

  if (!resultMove) {
    //means successfuly moved
    console.log("uploaded and moved using artworkPath", artworkPath);
    // upload to Cloudinary
    const resultCloudinary = await cloudinary.uploader.upload(artworkPath);
    if (resultCloudinary.secure_url) {
      console.log("result from Cloudinary", resultCloudinary);
      // TODO  now store in DB:
      //
      // 1. tags + eventually new tag(s): split received tags, then loop create if needed, then use id(s) when creating newArtwork next step
      // 2. artworks  : almost finished (tags), artworkId will be available for next step
      // 3. users : update collections push new artwork
      // step 1. tags:
      // if needed: // Tag.findOne({ name: { $regex: new RegExp(req.params.name, 'i') } })
      const tagsToCheck = req.body.tags.split(" ");
      const tagsToAdd = [];
      console.log("tagsToCheck", tagsToCheck);

      for (tagname of tagsToCheck) {
        const query = Tag.where({ name: tagname });
        const tag = await query.findOne();
        if (tag) {
          console.log(
            "tag already exists and can be added to this artwork",
            tag
          );
          tagsToAdd.push(tag._id);
        } else {
          console.log("create new tag for this artwork", tagname);
          const newTag = new Tag({
            name: tagname,
          });
          const querysave = newTag.save();
          const newDoc = await querysave;
          const queryfind = Tag.findById({ _id: newDoc._id });
          const tag = await queryfind;
          console.log("new tag created", tag._id);
          tagsToAdd.push(tag._id);
        }
      }
      // step 2. artworks:

      const newArtwork = new Artwork({
        uploader: req.body.uploader,
        // collection: req.body.collection, -> step3 users
        title: req.body.title,
        description: req.body.description,
        category: req.body.category,
        comments: [],
        tags: tagsToAdd,
        publishedDate: Date.now(),
        url: resultCloudinary.secure_url,
      });
      const querysave = newArtwork.save();
      const newDoc = await querysave;
      const queryfind = Artwork.findById({ _id: newDoc._id });
      const artwork = await queryfind;
      console.log("new artwork created", artwork._id);
      // step 3. users:
      const query = User.where({ "collections.name": req.body.collection });
      const userCollection = await query.findOne();
      if (userCollection) {
        console.log(
          "collection already exists and can be used to add the artwork",
          userCollection
        );
        //const doc = await User.findOneAndUpdate({ collections: { $elemMatch: { name: req.body.collection} } }, { $push: { "collections.$.artworks": {_id:artwork._id}} })
      } else {
        console.log(
          "will create new collection for this artwork ",
          req.body.collection
        );
        const newCollec = await User.updateOne(
          { username: req.body.uploader },
          {
            $push: { collections: { name: req.body.collection, artworks: [] } },
          }
        );
      }
      const doc = await User.findOneAndUpdate(
        { collections: { $elemMatch: { name: req.body.collection } } },
        { $push: { "collections.$.artworks": { _id: artwork._id } } }
      );

      console.log(
        "Artwork",
        artwork,
        "uploaded into ",
        req.body.uploader,
        " 's collection"
      );
      res.json({ result: true, data: artwork });
    } else {
      console.log(error, resultCloudinary);
      res.json({ result: false, error: "Cloudinary Upload failed" });
    }
  } else {
    console.log(error, resultMove);
    res.json({ result: false, error: "move failed resultMove" });
  }
  // whatever the result systematically remove tmp file.
  // means no retry on error ... ?
  fs.unlinkSync(artworkPath);
});
//////////////////get artworks with limit & offset
router.get("/", async (req, res) => {
  try {
    const offset = parseInt(req.query.offset);
    const limit = parseInt(req.query.limit);

    const artworks = await Artwork.find()
      .sort({ publishedDate: -1 }) // most recent on top
      .populate("tags")
      .skip(offset)
      .limit(limit);
    console.log(
      "##########Total Number of Artworks #############################",
      artworks.length
    );
    res.json({
      artworks,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
////////////////////////get artwork with user///////////////////////////
router.get("/uploader/:username", (req, res) => {
  Artwork.find({ uploader: req.params.username })
    .sort({ publishedDate: -1 }) // most recent on top
    .limit(req.query.limit)
    .populate("tags")
    .then((data) => {
      console.log(
        "##",
        req.params.username,
        "number of uploaded artworks",
        data.length
      );
      res.json({ artworkInfo: data, message: "artwork datas OK!!!" });
    });
});

//////////////////////////delete artwork & collection ////////////////////////////////////////////
router.delete("/:artworkId", async (req, res) => {
  try {
    const artworkId = req.params.artworkId;

    // find media url
    const artwork = await Artwork.findOne({ _id: artworkId });
    if (!artwork) {
      return res.status(404).json({ message: "Artwork not found" });
    }

    // Extract publicId in URL to suppress in Cloudinary
    let url = artwork.url.split("/");
    let publicId = url[url.length - 1].split(".")[0]; // no extension. we keep it only for raw

    // Suppress from Cloudinary
    await cloudinary.uploader.destroy(publicId);

    // Suppress artwork on artworks
    await Artwork.deleteOne({ _id: artworkId });

    // find username
    const user = await User.findOne({ username: artwork.uploader });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    //find collection includes artworkId
    const collection = user.collections.find((col) =>
      col.artworks.includes(artworkId)
    );
    if (!collection) {
      return res.status(404).json({ message: "Collection not found" });
    }

    // Suppress artwork from user collection
    collection.artworks.pull(artworkId);

    // Suppress empty collection
    if (collection.artworks.length === 0) {
      user.collections.pull(collection._id);
    }

    // Save user modifications
    await user.save();

    res.json({ deletedCount: 1 }); // 1 artwork removed
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting artwork", error });
  }
});

////////////////////get artwork with id///////////////////////////////////
router.get("/:artworkId", (req, res) => {
  Artwork.findOne({ _id: req.params.artworkId })
    .populate("tags")
    .then((data) => {
      console.log("found:", data.title);
      res.json({ artworkInfo: data, message: "artwork datas OK!!!" });
    });
});

router.get("/category/:categoryName", (req, res) => {
  Artwork.find({ category: req.params.categoryName })
    .sort({ publishedDate: -1 }) // most recent on top
    .populate("tags")
    .then((artworks) => {
      console.log(
        `###### Number of Artworks in ${req.params.categoryName} category:`,
        artworks.length
      );
      res.json({ artworks, message: "artworks in display ok!" });
    });
});
//////////////////ajout de commentaires //////////////////////////////
router.post("/comment/:id", async (req, res) => {
  const artworkId = req.params.id;
  const { username, comment } = req.body;
  try {
    const artwork = await Artwork.findById(artworkId);

    if (!artwork) {
      return res.status(404).json({ message: "Artwork not found" });
    }
    artwork.comments.push({ username, comment });

    await artwork.save();
    console.log(artwork);
    res.status(201).json(artwork);
  } catch (error) {
    res.status(500).json({ message: "Error adding comment", error });
  }
});

module.exports = router;
