var express = require("express");
var router = express.Router();
const { checkBody } = require("../modules/checkBody");
const User = require("../models/users");
const Artwork = require("../models/artworks");
const uid2 = require("uid2");
const bcrypt = require("bcrypt");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");

/* GET users listing. */
router.get("/", (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  Artwork.find()
    .sort({ publishedDate: -1 }) // most recent on top
    .populate("tags")
    .skip((page - 1) * limit)
    .limit(limit)
    .then((artworks) => {
      console.log(
        "##########Total Number of Artworks #############################",
        artworks.length
      );
      res.json({
        artworks,
      });
    })
    .catch((err) => {
      res.status(500).json({ message: err.message });
    });
});

///////////////get only artists populate artworks limit 3 artworks per artist//////////
// select only required fields for users (username avatarUrl bio) and artworks (url)

router.get("/artists", function (req, res) {
  User.find({
    collections: {
      $ne: [],
    },
  })
    .select("username avatarUrl bio")
    .populate({
      path: "collections.artworks",
      select: "url",
      options: { perDocumentLimit: 3 },
    })
    .then((data) => {
      console.log("# of Artists ", data.length);
      res.json({ result: true, artists: data });
    })
    .catch((err) => {
      res.status(500).json({ message: err.message });
    });
});

////signup
router.post("/signup", async (req, res) => {
  if (!checkBody(req.body, ["username", "email", "password"])) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }

  try {
    // Check if the email is already registered
    const existingEmail = await User.findOne({ email: req.body.email });
    if (existingEmail) {
      return res.json({ result: false, error: "Email already exists" });
    }

    // Check if the username is already registered
    const existingUsername = await User.findOne({
      username: { $regex: new RegExp(`^${req.body.username}$`, "i") },
    });
    if (existingUsername) {
      return res.json({ result: false, error: "Username already exists" });
    }

    const hash = bcrypt.hashSync(req.body.password, 10);

    const newUser = new User({
      username: req.body.username,
      password: hash,
      token: uid2(32),
      email: req.body.email,
    });

    await newUser.save();
    console.log("##Welcome ", req.body.username);
    userInfo = {
      username: newUser.username,
      token: newUser.token,
      email: newUser.email,
    };
    res.json({ result: true, userInfo });
  } catch (error) {
    console.error("Error during signup:", error);
    res.status(500).json({ result: false, error: "Internal server error" });
  }
});

////signin
router.post("/signin", (req, res) => {
  if (!checkBody(req.body, ["username", "password"])) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }

  //
  User.findOne({
    username: { $regex: new RegExp(`^${req.body.username}$`, "i") },
  })
    .populate(["favorites", "following"])
    .then((userInfo) => {
      // user exist and provided correct password : hash of provided password == hash saved during sign up
      if (
        userInfo &&
        bcrypt.compareSync(req.body.password, userInfo.password)
      ) {
        console.log("##", req.body.username, " just signed In");
        userInfo = {
          username: userInfo.username,
          token: userInfo.token,
          email: userInfo.email,
        };
        res.json({ result: true, userInfo });
      } else {
        res.json({ result: false, error: "wrong username or password" });
      }
    });
});
//////////search by username
router.get("/:username", (req, res) => {
  User.findOne({ username: req.params.username })
    .select(
      "username email avatarUrl bannerUrl bio favorites following collections"
    )
    .populate(["favorites", "following", "collections.artworks"])
    .then((userInfo) => {
      if (!userInfo) {
        return res
          .status(404)
          .json({ result: false, message: "User not found" });
      }
      res.json({
        result: true,
        userInfo,
        message: "successfully settings download",
      });
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ result: false, message: "Internal Server Error" });
    });
});

////////////upload banner || avatar => URL/////////////////////
router.post("/upload", async (req, res) => {
  try {
    // Check if the file is present in req.files
    if (!req.files || !req.files.image) {
      return res.status(400).json({ result: false, error: "No file uploaded" });
    }

    const image = req.files.image;
    const imagePath = `/tmp/${image.name}`;
    console.log("imagePath", imagePath);
    // Move the file to the temporary directory
    await image.mv(imagePath);

    // Upload the file to Cloudinary
    const result = await cloudinary.uploader.upload(imagePath);

    // Delete the temporary file
    fs.unlinkSync(imagePath);

    // Log the uploaded URL
    console.log("Uploaded Image URL:", result.secure_url);

    res.json({
      result: true,
      imageUrl: result.secure_url,
      message: "successfully uploaded",
    });
  } catch (error) {
    console.error("Error during file upload:", error);
    res.status(500).json({ result: false, error: "Failed to upload file" });
  }
});
////////////////Update & bio & avatar & banner//////////////////////////////////////
router.put("/:username", async (req, res) => {
  const { username } = req.params;
  const { bio, avatarUrl, bannerUrl } = req.body;
  console.log("Username:", username);
  console.log("Body:", req.body);

  try {
    //Update user
    const updatedUser = await User.findOneAndUpdate(
      { username },
      { bio, avatarUrl, bannerUrl },
      { new: true } // Return the new version
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User updated successfully", userInfo: updatedUser });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
////////////////get collection by username & collection.name//////////////////////////////////////
router.get("/collection/:username/:collection", async (req, res) => {
  const { username, collection } = req.params;

  try {
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const userCollection = user.collections.find(
      (col) => col.name === collection
    );

    if (!userCollection) {
      return res.status(404).json({ message: "Collection not found" });
    }

    const artworkIds = userCollection.artworks;
    const artworks = await Artwork.find({ _id: { $in: artworkIds } });

    res.json({ message: "Collection found successfully", artworks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});
////////////add bookmark artwork//////////////////////////////////////////////
router.post("/bookmark/:username/:id", async (req, res) => {
  try {
    const { id, username } = req.params;

    //find user
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ result: false, error: "User not found" });
    }
    // Add id to favorite
    user.favorites.push(id);
    // Save modification
    await user.save();

    res.json({ result: true, message: "Successfully added" });
  } catch (error) {
    console.error("Error with user", error);
    res.status(500).json({ result: false, error: "Problem with user" });
  }
});
////////////delete bookmark artwork//////////////////////////////////////////////
router.delete("/bookmark/:username/:id", async (req, res) => {
  try {
    const { id, username } = req.params;

    //find user
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ result: false, error: "User not found" });
    }
    // remove id to favorite
    user.favorites = user.favorites.filter((favId) => favId.toString() !== id);
    // Save modification
    await user.save();

    res.json({ result: true, message: "Successfully deleted" });
  } catch (error) {
    console.error("Error with user", error);
    res.status(500).json({ result: false, error: "Problem with user" });
  }
});
////////////add following///////////////////////////////////////////////////////
router.post("/following/:username/:uploader", async (req, res) => {
  try {
    const { uploader, username } = req.params;

    //find user & follow
    const user = await User.findOne({ username });
    const follow = await User.findOne({ username: uploader });

    if (!user) {
      return res.status(404).json({ result: false, error: "User not found" });
    }
    // Add follow to following
    user.following.push(follow);
    // Save modification
    await user.save();

    res.json({ result: true, message: "Successfully added" });
  } catch (error) {
    console.error("Error with user", error);
    res.status(500).json({ result: false, error: "Problem with user" });
  }
});
////////////delete following//////////////////////////////////////////////
router.delete("/following/:username/:uploader", async (req, res) => {
  try {
    const { uploader, username } = req.params;

    //find user & follow
    const user = await User.findOne({ username });
    const follow = await User.findOne({ username: uploader });
    console.log("---------------------------follow", follow);
    if (!user) {
      return res.status(404).json({ result: false, error: "User not found" });
    }
    // remove id to favorite
    user.following = user.following.filter(
      (favId) => favId.toString() !== follow._id.toString()
    );
    // Save modification
    await user.save();

    res.json({ result: true, message: "Successfully deleted" });
  } catch (error) {
    console.error("Error with user", error);
    res.status(500).json({ result: false, error: "Problem with user" });
  }
});
module.exports = router;
