var express = require('express');
var router = express.Router();
const mongoose = require('mongoose');

const cloudinary = require('cloudinary').v2;
const fs = require('fs');

const Artwork = require('../models/artworks');
const Tag = require('../models/tags');
const { checkBody } = require('../modules/checkBody');


// Notes on comments 
// * when someone add a comment:  update existing document means router.put with a mongo update : NewArtwork.UpdateOne()
// * when displaying Artwork details (see Miro screen 5): 

// POST route 
// create one artwork. No bulk import, even we accept n files during upload, files will be stored in ./tmp and uuploaded
// to cloudinary 1 by  1 
// 

router.post('/upload', async (req, res) => {
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
    if (!checkBody(req.files, ['imageFromFront']) || !checkBody(req.body, ['title', 'description', 'category', 'collection', 'uploader'])) {
        res.json({ result: false, error: 'Missing or empty fields' });
        console.log('Check  body, required fields: title,description,category. check also req.filename')
        return;
    }
    console.log("#######File ready to move under ./tmp and upload to Cloudinary:", req.files.imageFromFront);
    // TODO: check extension  use modules/genfilename(original filename)  return filename to use.
    const artworkPath = `./tmp/${req.files.imageFromFront.name}`
    const resultMove = await req.files.imageFromFront.mv(artworkPath);

    if (!resultMove) {  //means successfuly moved 
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

            // step 2. artworks:
            const newArtwork = new Artwork({
                uploader: req.body.uploader,
                collection: req.body.collection,
                title: req.body.title,
                description: req.body.description,
                category: req.body.category,
                comments: [],
                tags: [req.body.tags],  // WIP: currently passing hardcoded id (one) will be available when step1 ok
                publishedDate: Date.now(),
                url: resultCloudinary.secure_url,
            });
            // debug: console.log("#### trying to save newArtwork", newArtwork)
            newArtwork.save().then(newDoc => (Artwork.findById({ _id: newDoc._id }))
                .then(artwork => res.json({ result: true, artwork })));
        }
        else {
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


router.get('/', (req, res) => {
    Artwork.find()
        .sort({ publishedDate: -1 })  // most recent on top 
        .populate('tags')
        .then(artworks => {
            console.log("##########Total Number of Artworks #############################", artworks.length);
            res.json({
                artworks,
            });
        })
})

router.delete('/:artworkId', (req, res) => {
    Artwork.deleteOne({ _id: req.params.artworkId })
        .then(data => {
            console.log(data);
            res.json({ deletedCount: data.deletedCount }); //0 or 1 if matched:  Front side test if(data) to know if deleted  
        })
});

router.get('/:artworkId', (req, res) => {
    Artwork.findOne({ _id: req.params.artworkId })
        .populate('tags')
        .then(data => {
            console.log(data);
            res.json({ artworkInfo: data });
        })
});

router.get('/category/:categoryName', (req, res) => {
    Artwork.find({category:req.params.categoryName})
        .sort({ publishedDate: -1 })  // most recent on top 
        .populate('tags')
        .then(artworks => {
            console.log(`###### Number of Artworks in ${req.params.categoryName} category:`, artworks.length);
            res.json({
                artworks,
            });
        })
})

router.post('/comment/:id', async (req, res) => {
    const artworkId = req.params.id;
    const { username, comment } = req.body;
    try {
        const artwork = await Artwork.findById(artworkId);

        if (!artwork) {
            return res.status(404).json({ message: 'Artwork not found' });
        }
        artwork.comments.push({ username, comment });

        await artwork.save();
        console.log(artwork)
        res.status(201).json(artwork);
    } catch (error) {
        res.status(500).json({ message: 'Error adding comment', error });
    }
});


module.exports = router;