const express = require('express');
const {searchCtrl} = require('../controllers/searchController.js');
const searchRouter = express.Router(); 
// const {auth}= require("../middleware/authMiddleware.js")

searchRouter.post ('/getSearch', searchCtrl);

 
module.exports = searchRouter;