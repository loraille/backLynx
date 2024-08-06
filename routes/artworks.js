var express = require('express');
var router = express.Router();
const mongoose = require('mongoose');

const cloudinary = require('cloudinary').v2;
const fs = require('fs');

const Artwork = require('../models/artworks');
const Tag = require('../models/tags');
const { checkBody } = require('../modules/checkBody');

// GET route
// Notes on comments 
// * when someone add a comment:  update existing document means router.put with a mongo update :  NewArtwork.UpdateOne()
// * when displaying Artwork details (see Miro screen 5): 
//  constraint don't send MongoDB user _ids, impact: 
// BE: extra step for all comments of this Artwork retrieve all usernames 
// FE: only once per user session : init only  = comments array username:comment, will be stored on redux store.
//     comments displayed according depending on username (creator of the artwork on the right with color) 


// POST route 
// create one artwork. No bulk import, even we accept n files during upload, files will be stored in ./tmp and uuploaded
// to cloudinary 1 by  1 
// checkBody []

router.post('/upload', async (req, res) => {
    //description is mandatory ok?
    if (!checkBody(req.files, ['imageFromFront']) || !checkBody(req.body, ['title', 'description', 'category'])) {
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
            // store in DB:
            const newArtwork = new Artwork({
                title: req.body.title,
                description: req.body.description,
                category: req.body.category,
                comments: [],
                tags: req.body.tags,  // WIP ignoring ref, should be ~ :  new mongoose.Types.ObjectId(req.body.tags) , 
                publishedDate: Date.now(),
                url: resultCloudinary.secure_url,
            });

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
            console.log("###", artworks);
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




module.exports = router;