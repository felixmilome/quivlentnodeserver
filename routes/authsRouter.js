const express = require('express');
const {registerCtrl, loginCtrl} = require('../controllers/authsController.js');
// import { auth } from '../middleware/authMiddleware.js';


const authsRouter = express.Router(); 

authsRouter.post ('/register', registerCtrl);
authsRouter.post ('/login', loginCtrl);

module.exports = authsRouter;