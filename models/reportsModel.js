const mongoose = require('mongoose');

const reportsSchema = new mongoose.Schema({

    reporterId:{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UsersModel',
      required: true
    },
    reportedId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UsersModel',
        required: true
      },
    reason: {
        type:String,
        required:false
    },
    createdAt: {
      type: Date,
      default: Date.now
    },

  });

  exports.ReportsModel = mongoose.model("ReportsModel", reportsSchema, "ReportsModel");