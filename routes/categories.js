var express = require('express');
var router = express.Router();
const mongoose = require('mongoose');


const Category = require('../models/categories');
const { checkBody } = require('../modules/checkBody');

router.get('/', (req, res)=>{
    Category.find()
    .then(categories => { 
        console.log("###",categories);
        res.json({
            categories,
        });
    })
})


module.exports = router;