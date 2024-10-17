const express = require('express');
const {registerCtrl, loginCtrl, verifyRegisterLinkCtrl} = require('../controllers/authsController.js');
const authsRouter = express.Router(); 

authsRouter.post ('/register', registerCtrl);
authsRouter.post ('/login', loginCtrl);
authsRouter.post ('/verify', verifyRegisterLinkCtrl);

module.exports = authsRouter;