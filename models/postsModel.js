const mongoose = require("mongoose");
const Schema = mongoose.Schema;


const postsSchema = Schema({
  creatorMiniProfile: {
    type: Schema.Types.ObjectId,
    ref: "UsersModel",

  },
  captionsArray: [String],
  filesArray: [String],
  publicity: {
    type: String,
    default: "public",
  },
  likersArray: [String],
  dislikersArray:[String],
  viewersArray:[String],
  commentersArray:[String],
  createdTime: { type: Date, default: Date.now },  // Timestamp for when the comment was created
  updatedTime: { type: Date, default: Date.now },  // Timestamp for when the comment was last edited
  comments: [String],

});

exports.PostsModel = mongoose.model("PostsModel", postsSchema, "PostsModel");


