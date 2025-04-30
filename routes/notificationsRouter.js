const express = require('express');

const {
addNotificationCtrl, 
 getNotificationsCtrl, editNotificationsCtrl,
}= require('../controllers/notificationsController.js');


const {auth} = require("../middleware/authMiddleware.js")

const notificationsRouter = express.Router(); 

notificationsRouter.post ('/addNotification', auth, addNotificationCtrl);
notificationsRouter.post ('/getNotifications', auth, getNotificationsCtrl);
notificationsRouter.post ('/editNotifications',auth, editNotificationsCtrl);

module.exports = notificationsRouter;