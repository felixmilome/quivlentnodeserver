const express = require('express');
const {getChatsCtrl, getMessagesCtrl,
     postMessageCtrl,editMessageCtrl,
    deleteMessageCtrl } = require('../controllers/messagesController.js');

const {auth} = require("../middleware/authMiddleware.js")

const messagesRouter = express.Router(); 

messagesRouter.post ('/getChats',auth, getChatsCtrl);
messagesRouter.post ('/getMessages',auth, getMessagesCtrl);
messagesRouter.post ('/postMessage',auth, postMessageCtrl);
messagesRouter.post ('/editMessage',auth, editMessageCtrl);
messagesRouter.post ('/deleteMessage',auth, deleteMessageCtrl);

module.exports = messagesRouter;