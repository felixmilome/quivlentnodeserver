const express = require('express');
const {getProfileCtrl, editProfileCtrl, getUsersProfileCtrl, sendOrAcceptMatchRequestCtrl, blockOrUnblockUserCtrl} = require('../controllers/profileController.js')
const {multerUpload} = require("../middleware/multer.js");
const {auth}= require("../middleware/authMiddleware.js")

const profileRouter = express.Router(); 


profileRouter.post('/editProfile', auth, multerUpload.fields([ 
    { name: 'dpPath', maxCount: 1 },       // Profile picture field
    { name: 'photoPathsArray', maxCount: 4}  // Timeline photos
  ]), editProfileCtrl);
profileRouter.post ('/getProfile', getProfileCtrl);
profileRouter.post ('/match', auth, sendOrAcceptMatchRequestCtrl);
profileRouter.post ('/block', auth, blockOrUnblockUserCtrl);
profileRouter.post ('/getUsersProfile', getUsersProfileCtrl);


module.exports = profileRouter;