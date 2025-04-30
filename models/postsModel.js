const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const miniPostSchema = new Schema({
  indexId:Number,
  caption:String,
  noneRating:Boolean,
  imageUrl:String,
  ratingsArray:[String]

}, { _id: false });


const postsSchema = Schema({
  creatorMiniProfile: {
    type: Schema.Types.ObjectId,
    ref: "UsersModel",

  },
  title:String,
  miniPostsArray:[miniPostSchema],
  // captionsArray: [String],
  // filesArray: [String],
  publicity: {
    type: String,
    default: "public",
  },
  likersArray: [String],
  dislikersArray:[String], 
  viewersArray:[String],
  commentsArray:[String],
  createdTime: { 
    type: Number,
    default: Date.now
  },  // Timestamp for when the comment was created
  updatedTime: {   type: Number,
    default: Date.now },  // Timestamp for when the comment was last edited
  comments: [String],

});

exports.PostsModel = mongoose.model("PostsModel", postsSchema, "PostsModel");


