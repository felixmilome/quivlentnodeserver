
const {getUserNotifications, createNotification} = require('./controllerHandlers/notificationHandlers.js');
const { NotificationsModel } = require('../models/notificationsModel.js');

exports.getNotificationsCtrl = async(req, res) => {

    try {

        const userId = req.userId;
        const newNotifications = await getUserNotifications(userId);
        return res.status(200).json({status:'success', data:newNotifications, message:'success'});

      } catch (error) {

        console.error(error);
        return res.status(500).json({
          status: 'error',
          message: 'Internal Server Error',
        });

      }
}

exports.addNotificationCtrl = async(req, res) => {

  try {

      const senderId = req.userId;
      const {receiverId, type, referenceId} = req.body;

      const newNotification = await createNotification({
        senderMiniProfile: senderId,
        receiverId,
        type:type,
        referenceId
      });

      return res.status(200).json({status:'success', data:newNotification, message:'success'});

    } catch (error) {

      console.error(error);
      return res.status(500).json({
        status: 'error',
        message: 'Internal Server Error',
      });

    }
}

exports.editNotificationsCtrl = async(req, res) => {

  try {

    if (req.body?.type === 'read') {
      const { idsArray } = req.body;
  
      const readNotifications = await NotificationsModel.updateMany(
          { _id: { $in: idsArray } }, // Match notifications with IDs in idsArray
          { $set: { isRead: true } }     // Mark them as read
      );
  
      return res.status(200).json({
          status: 'success',
          // data: readNotifications,
          message: 'successful'
      });
  }
    

    } catch (error) {
      
      console.error(error);
      return res.status(500).json({
        status: 'error',
        message: 'Internal Server Error',
      });

    }
}