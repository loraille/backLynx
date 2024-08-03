const mongoose = require('mongoose')

const userSchema = mongoose.Schema({
    firstname: String,
    password: String,
    email: String,
    token: String
})

const Users = mongoose.model('user', userSchema)

module.exports = Users