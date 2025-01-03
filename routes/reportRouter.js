const express = require('express');
const {postReportCtrl} = require('../controllers/reportController.js');
const reportRouter = express.Router(); 
const {auth}= require("../middleware/authMiddleware.js")

reportRouter.post ('/postReport',auth, postReportCtrl);

 
module.exports = reportRouter;