var express = require('express');
var router = express.Router();
const mongoose = require('mongoose');


const Category = require('../models/categories');
const Artwork = require('../models/artworks');
const { checkBody } = require('../modules/checkBody');

// Route pour obtenir toutes les catégories//////////////////////////////////
router.get('/', (req, res)=>{
    Category.find()
    .then(categories => { 
        console.log("###",categories);
        res.json({
            categories,
        });
    })
})

// Route pour obtenir les œuvres d'art par catégorie///////////////////////////
router.get('/:categoryId/artworks', (req, res) => {
    const { category } = req.params;
    Artwork.find({ category })
        .then(artworks => {
            if (artworks.length === 0) {
                res.status(404).json({ result: false, error: 'No artworks found for this category' });
                return;
            }
            res.json({ result: true, artworks });
        })
        .catch(error => {
            res.status(500).json({ result: false, error: 'Error fetching artworks', error });
        });
});

module.exports = router;