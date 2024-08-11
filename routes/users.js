var express = require('express');
var router = express.Router();
const { checkBody } = require('../modules/checkBody');
const User = require('../models/users')
const uid2 = require('uid2');
const bcrypt = require('bcrypt');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

/* GET users listing. */
router.get('/', function (req, res) {
  User.find().then(data => {
    res.json({ 'result': true, 'users': data });
  }).catch(err => {
    res.status(500).json({ message: err.message });
  });
});

////signup
router.post('/signup', (req, res) => {
  if (!checkBody(req.body, ['username', 'email', 'password'])) {
    res.json({ result: false, error: 'Missing or empty fields' });
    return;
  }

  // Check if the user has not already been registered
  User.findOne({ email: req.body.email }).then(data => {
    if (data === null) {
      const hash = bcrypt.hashSync(req.body.password, 10);

      const newUser = new User({
        username: req.body.username,
        password: hash,
        token: uid2(32),
        email: req.body.email,
      });

      newUser.save().then(newDoc => {
        res.json({ result: true, userInfo: newDoc });
      });
    } else {
      // User already exists in database
      res.json({ result: false, error: 'User already exists' });
    }
  });
});


////signin
router.post('/signin', (req, res) => {
  if (!checkBody(req.body, ['username', 'password'])) {
    res.json({ result: false, error: 'Missing or empty fields' });
    return;
  }

  // 
  User.findOne({ username: req.body.username })
    .populate(['favorites', 'following'])
    .then(userInfo => {
      // user exist and provided correct password : hash of provided password == hash saved during sign up 
      if (userInfo && bcrypt.compareSync(req.body.password, userInfo.password)) {
        console.log({ result: true, userInfo });
        res.json({ result: true, userInfo, });
      } else {
        res.json({ result: false, error: 'wrong username or password' });
      }
    });
})
//////////search by username
router.get('/:username', (req, res) => {
  User.findOne({ username: req.params.username })
    .populate(['favorites', 'following', 'collections.artworks'])
    .then(userInfo => {
      if (!userInfo) {
        return res.status(404).json({ result: false, message: 'User not found' });
      }
      console.log(userInfo);
      res.json({ result: true, userInfo, message: "successfully settings download" });
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ result: false, message: 'Internal Server Error' });
    });
});
////////////upload banner || avatar => URL/////////////////////
router.post('/upload', async (req, res) => {
  try {
    // Check if the file is present in req.files
    if (!req.files || !req.files.image) {
      return res.status(400).json({ result: false, error: 'No file uploaded' });
    }

    const image = req.files.image;
    const imagePath = `./tmp/${image.name}`;
    console.log('imagePath', imagePath)
    // Move the file to the temporary directory
    await image.mv(imagePath);

    // Upload the file to Cloudinary
    const result = await cloudinary.uploader.upload(imagePath);

    // Delete the temporary file
    fs.unlinkSync(imagePath);

    // Log the uploaded URL
    console.log('Uploaded Image URL:', result.secure_url);

    res.json({ result: true, imageUrl: result.secure_url, message: "successfully uploaded" });
  } catch (error) {
    console.error('Error during file upload:', error);
    res.status(500).json({ result: false, error: 'Failed to upload file' });
  }
});
////////////////Update & bio & avatar & banner//////////////////////////////////////
router.put('/:username', async (req, res) => {
  const { username } = req.params;
  const { bio, avatarUrl, bannerUrl } = req.body;
  console.log('Username:', username);
  console.log('Body:', req.body);

  try {
    //Update user
    const updatedUser = await User.findOneAndUpdate(
      { username },
      { bio, avatarUrl, bannerUrl },
      { new: true } // Return the new version
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User updated successfully', userInfo: updatedUser });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
