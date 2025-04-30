const mongoose = require('mongoose');

const chatsSchema = new mongoose.Schema({
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UsersModel',
        required: true 
      }
    ],
    initiator:{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UsersModel',
      required: true
    },
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MessagesModel',
        required: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    accepted:{
      type:Boolean,
      default:false
    }
  });

  exports.ChatsModel = mongoose.model("ChatsModel", chatsSchema, "ChatsModel");