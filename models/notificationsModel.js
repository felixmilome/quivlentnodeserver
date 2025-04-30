const mongoose = require('mongoose');

const notificationsSchema = new mongoose.Schema({
  senderMiniProfile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UsersModel',
    required: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UsersModel',
    required: true
  },
  type: {
    type: String,
    enum: ['postLike', 'comment', 'commentLike', 'chat', 'matchRequest', 'match'], // Customize types as needed
    required: true
  },
  referenceId: {
    type: String, // Refers to the related item (e.g., message, post)
    required: true
  },
  message: {
    type: String,
  },
  media: {
    type: String, // URL or path to any associated media, if applicable
  },
  createdAt: {
    type: Number,
    default: Date.now
  },
  isRead: {
    type: Boolean,
    default: false
  },
});

exports.NotificationsModel = mongoose.model("NotificationsModel", notificationsSchema, "NotificationsModel");
