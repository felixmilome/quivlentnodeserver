const mongoose = require('mongoose');
const { Schema } = mongoose;

const commentsSchema = new Schema({
  postId: String,  // Reference to the post the comment belongs to
  creatorMiniProfile: { type: Schema.Types.ObjectId, ref: 'UsersModel', required: true },  // Reference to the user who made the comment
  content: { type: String, required: true },  // Comment text
  repliesArray: [String],  // Array of replies, referencing the same schema
  type:String,
  parentCommentId: String,  // For nested replies, null if it's a top-level comment
  createdTime: { type: Date, default: Date.now },  // Timestamp for when the comment was created
  updatedTime: { type: Date, default: Date.now },  // Timestamp for when the comment was last edited
  likersArray: [String],  // Users who liked the comment
  dislikersArray: [String]  // Users who disliked the comment
});

// Export the model
exports.CommentsModel = mongoose.model("CommentsModel", commentsSchema, "CommentsModel");
