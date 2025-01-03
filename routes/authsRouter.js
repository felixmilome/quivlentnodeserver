const express = require('express');
const {registerCtrl, loginCtrl, verifyRegisterLinkCtrl, requestChangePasswordCtrl, verifyPassChangeCtrl, requestDeleteCtrl, verifyDeleteCtrl} = require('../controllers/authsController.js');
const authsRouter = express.Router(); 
const {auth} = require("../middleware/authMiddleware.js")

authsRouter.post ('/register', registerCtrl);
authsRouter.post ('/login', loginCtrl);
authsRouter.post ('/verify', verifyRegisterLinkCtrl);
authsRouter.post ('/requestPasswordChange', requestChangePasswordCtrl);
authsRouter.post ('/verifyPasswordChange', verifyPassChangeCtrl);
authsRouter.post ('/requestDelete', auth, requestDeleteCtrl);  
authsRouter.post ('/verifyDelete', verifyDeleteCtrl); 

module.exports = authsRouter;