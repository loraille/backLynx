var express = require('express');
var router = express.Router();
const mongoose = require('mongoose');

const Artwork = require('../models/artworks')
const Tag = require('../models/tags')
const User = require('../models/users')


//recherche des oeuvres d'art dont le nom contient//////////////////////////////////////////
router.get('/artworks', async (req, res) => {
    const query = req.query.title;
    if (!query) {
        return res.status(400).json({ error: 'Query parameter "title" is required' });
    }
    try {
        // Rechercher les oeuvres d'art dont le titre contient le texte spécifiée
        const results = await Artwork.find({
            title: { $regex: query, $options: 'i' }
        });

        res.json(results);
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching artworks' });
    }
});
//recherche des oeuvres dont le tag commence par////////////////////////////////////////////////
router.get('/tags', async (req, res) => {
    const query = req.query.tag;
    if (!query) {
        return res.status(400).json({ error: 'Query parameter "tag" is required' });
    }

    try {
        // Rechercher les tags dont le nom commence par la chaîne de caractères spécifiée
        const tags = await Tag.find({
            name: { $regex: `^${query}`, $options: 'i' }
        });

        // Extraire les IDs des tags trouvés
        const tagIds = tags.map(tag => tag._id);

        // Rechercher les œuvres d'art dont les tags contiennent les IDs trouvés
        const results = await Artwork.find({
            tags: { $in: tagIds }
        });


        res.json(results);
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching artworks' });
    }
});

//recherche des artistes dont le nom contient////////////////////////////////////////////////
router.get('/artists', async (req, res) => {
    const query = req.query.username;
    if (!query) {
        return res.status(400).json({ error: 'Query parameter "username" is required' });
    }
    try {
        // Rechercher les user dont le nom contient le texte spécifié
        const results = await User.find({
            username: { $regex: query, $options: 'i' }
        });

        res.json(results);
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching users' });
    }
});

module.exports = router;