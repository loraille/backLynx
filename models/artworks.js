const mongoose = require('mongoose')

const artworkSchema = mongoose.Schema({
    uploader: String,
    title: String,
    description: String,
    category: String,
    url: String,
    comments: [{ username: String, comment: String }],
    tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'tags' }],
    publishedDate: Date,
})

const Artwork = mongoose.model('artworks', artworkSchema)

module.exports = Artwork