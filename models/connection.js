const mongoose = require("mongoose")
const connectionString = process.env.CONNECTION_STRING

mongoose.connect(connectionString, { connectTimeoutMS: 2000 })
    .then(() => console.log('connected to lynx database. Ready to use following collections: users, artworks, categories and tags'))
    .catch(error => console.error(error));