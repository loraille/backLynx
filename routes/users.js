var express = require('express');
var router = express.Router();
const { checkBody } = require('../modules/checkBody');
const User = require('../models/user')
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
  if (!checkBody(req.body, ['firstname', 'email', 'password'])) {
    res.json({ result: false, error: 'Missing or empty fields' });
    return;
  }

  // Check if the user has not already been registered
  User.findOne({ email: req.body.email }).then(data => {
    if (data === null) {
      const hash = bcrypt.hashSync(req.body.password, 10);

      const newUser = new User({
        firstname: req.body.firstname,
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
  if (!checkBody(req.body, ['email', 'password'])) {
    res.json({ result: false, error: 'Missing or empty fields' });
    return;
  }

  // Check if the user has not already been registered
  User.findOne({ email: req.body.email }).then(data => {
    if (data === null) {
      res.json({ 'result': false, 'users': 'user false' });
    } else {
      res.json({ user: true, userInfo: data });
    }
  }
  )
})

module.exports = router;
