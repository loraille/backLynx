var express = require('express');
var router = express.Router();
const { checkBody } = require('../modules/checkBody');
const User = require('../models/users')
const uid2 = require('uid2');
const bcrypt = require('bcrypt');

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
        res.json({ result: true, userInfo });
      } else {
        res.json({ result: false, error: 'wrong username or password' });
      }
    });
})
//////////search by username
router.get('/:username', (req, res) => {
  User.findOne({ username: req.params.username })
    .populate(['favorites', 'following'])
    .then(userInfo => {
      if (!userInfo) {
        return res.status(404).json({ result: false, message: 'User not found' });
      }
      console.log(userInfo);
      res.json({ result: true, userInfo });
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({ result: false, message: 'Internal Server Error' });
    });
});
////////////add banner || && avatar ||&& bio////////////////////////
router.post('/settings', async (req, res) => {
  try {
    const { username, bio, avatarUrl, bannerUrl } = req.body;

    // Vérifiez si des fichiers ont été téléchargés
    let avatarUrlUpdated = avatarUrl;
    let bannerUrlUpdated = bannerUrl;

    if (req.files && req.files.avatar) {
      const avatarPath = `./tmp/${req.files.avatar.name}`;
      await req.files.avatar.mv(avatarPath);
      const resultAvatar = await cloudinary.uploader.upload(avatarPath);
      avatarUrlUpdated = resultAvatar.secure_url;
      fs.unlinkSync(avatarPath);
    }

    if (req.files && req.files.banner) {
      const bannerPath = `./tmp/${req.files.banner.name}`;
      await req.files.banner.mv(bannerPath);
      const resultBanner = await cloudinary.uploader.upload(bannerPath);
      bannerUrlUpdated = resultBanner.secure_url;
      fs.unlinkSync(bannerPath);
    }

    // Mettez à jour les paramètres de l'utilisateur dans la base de données
    const updatedUser = await User.findOneAndUpdate(
      { username },
      { bio, avatarUrl: avatarUrlUpdated, bannerUrl: bannerUrlUpdated },
      { new: true }
    );

    res.json({ result: true, user: updatedUser });
  } catch (error) {
    console.error(error);
    res.json({ result: false, error: 'Failed to update settings' });
  }
});

// Route pour télécharger les fichiers (avatar et bannière)
router.post('/upload', async (req, res) => {
  try {
    const uploadedFiles = {};

    if (req.files && req.files.avatar) {
      const avatarPath = `./tmp/${req.files.avatar.name}`;
      await req.files.avatar.mv(avatarPath);
      const resultAvatar = await cloudinary.uploader.upload(avatarPath);
      uploadedFiles.avatarUrl = resultAvatar.secure_url;
      fs.unlinkSync(avatarPath);
    }

    if (req.files && req.files.banner) {
      const bannerPath = `./tmp/${req.files.banner.name}`;
      await req.files.banner.mv(bannerPath);
      const resultBanner = await cloudinary.uploader.upload(bannerPath);
      uploadedFiles.bannerUrl = resultBanner.secure_url;
      fs.unlinkSync(bannerPath);
    }

    res.json({ result: true, uploadedFiles });
  } catch (error) {
    console.error(error);
    res.json({ result: false, error: 'Failed to upload files' });
  }
});

module.exports = router;
