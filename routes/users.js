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
  User.findOne({ username: req.body.username }).then(userInfo => {
  // user exist and provided correct password : hash of provided password == hash saved during sign up 
    if (userInfo && bcrypt.compareSync(req.body.password, userInfo.password)) {
      console.log({ result: true, userInfo });
      res.json({ result: true, userInfo });
    } else {
      res.json({ result: false, error: 'wrong username or password' });
    }
  });
})

module.exports = router;
