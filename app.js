require("dotenv").config();
require("./models/connection");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var artworksRouter = require("./routes/artworks");
var categoriesRouter = require("./routes/categories");
var searchRouter = require("./routes/searchs");

var app = express();
const cors = require("cors");
app.use(cors());

const fileUpload = require("express-fileupload");
app.use(fileUpload());

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/artworks", artworksRouter);
app.use("/categories", categoriesRouter);
app.use("/searchs", searchRouter);
module.exports = app;
