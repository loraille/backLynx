const mongoose = require('mongoose')

// an artist: User.collections !== []
const collectionSchema = mongoose.Schema({
    name: String,
    artworks: [{type: mongoose.Schema.Types.ObjectId, ref: 'artworks'}],
   });

const userSchema = mongoose.Schema({
    username: String,
    email: String,
    password: String,
    token: String,
    bio: String,
    avatarUrl: String,
    bannerUrl: String,
    favorites: [{type: mongoose.Schema.Types.ObjectId, ref: 'artworks'}],
    following: [{type: mongoose.Schema.Types.ObjectId, ref: 'users'}],
    creationDate: Date,
    collections: [collectionSchema] 
});


const User = mongoose.model('users', userSchema)

module.exports =  User ;