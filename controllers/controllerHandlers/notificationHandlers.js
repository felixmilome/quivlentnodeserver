const {NotificationsModel} = require('../../models/notificationsModel.js');

exports.getUserNotifications= async(userId) =>{
    try {
      const notifications = await NotificationsModel.find({ receiverId: userId })
        .populate('senderMiniProfile', '_id username dpPath') // Populate with selected fields
        .sort({ createdAt: -1 }) // Sort by most recent notifications
        .limit(50) // Limit to the top 50 notifications
        .exec();
  
      return notifications;
    } catch (error) {
      console.error("Error fetching notifications:", error);
      throw error;
    }
}

exports.createNotification = async ( notificationObj) => {

  try {
    const notification = new NotificationsModel(notificationObj);

    // Save the new notification
    const unpopulatedNotification = await notification.save();

    // Populate senderMiniProfile with specific fields before returning
   const newNotification = await unpopulatedNotification.populate('senderMiniProfile', '_id username dpPath');

    return newNotification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
}
