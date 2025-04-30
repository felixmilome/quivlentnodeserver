const mongoose = require('mongoose');

const messagesSchema = new mongoose.Schema({
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UsersModel',
      required: true
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UsersModel',
      required: true
    },
    chatId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChatsModel',
        required: true
      },
    messageText: {
      type: String,
      required: true
    },
    media: [
      {
        type: String, // URL or path to image, video, or any media
      }
    ],
    sentAt: {
      type: Number,
      default: Date.now
    },
    seen: {
      type: Boolean,
      default: false
    },
  });

  exports.MessagesModel = mongoose.model("MessagesModel", messagesSchema, "MessagesModel");