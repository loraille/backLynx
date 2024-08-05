var express = require('express');
var router = express.Router();
const mongoose = require('mongoose');


const Category = require('../models/categories');
const { checkBody } = require('../modules/checkBody');
// IMPORTANT: pas d'image 
router.post('/upload', async (req, res) => {
    if (!checkBody(req.body, ['name','description','image'])) { 
        res.json({ result: false, error: 'Missing or empty fields' });
        console.log('Check  body, required fields: name,description,category')
        return; 
    }
    
    const newArtwork = new Artwork({ 
        name: req.body.name,    
        description: req.body.description,
        ImageBitmap: resultCloudinary.secure_url,
      });
    
      newArtwork.save().then(newDoc => (Category.findById({_id: newDoc._id}))
      .then(category => res.json({ result: true, category })));
});
