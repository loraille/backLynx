const mongoose = require('mongoose')
 
const artworkSchema = mongoose.Schema({
    name: String,
    description: String,
    category: String,
    url: String,
    comments: [{userId: mongoose.Schema.Types.ObjectId, comment: String}],
    tags: [{type: mongoose.Schema.Types.ObjectId, ref: 'tags'}],
    publishedDate: Date,
})

const Artwork = mongoose.model('artworks', artworkSchema)

module.exports = Artwork