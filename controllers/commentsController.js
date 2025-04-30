
const { CommentsModel } = require( "../models/commentsModel");
const {PostsModel} = require ('../models/postsModel.js') 
const {commentsSummaryAI} = require('./controllerHandlers/aiHandlers.js')

exports.addCommentCtrl = async(req,res) => {
 

    try{
    
      const userId = req.userId;
      const {content, type, postId} = req.body
     

      const newCommentData = {
        creatorMiniProfile: userId, 
        content,
        postId,
        type,
        ...(type === 'reply' && { parentCommentId: req.body?.parentCommentId })
      };
      const newComment = new CommentsModel(newCommentData);
      const savedComment = await newComment.save();

      const populatedComment = await CommentsModel.findById(savedComment._id)
        .populate({
          path: 'creatorMiniProfile',
          select: 'username dpPath _id'
        });


        // Find the parent post by postId
        const post = await PostsModel.findById(postId);
      
        //console.log(post)
        if (!post) {
          return res.json({ status: 'error', message: 'Post not found' });
        }

        post.commentsArray.push(savedComment?._id);
        await post.save();

        // If the comment is a reply, find the parent comment and push the reply's ID into it
        if (type === 'reply') {
          const parentComment = await CommentsModel.findById(req.body.parentCommentId);
          if (!parentComment) {
            return res.json({ status: 'error', message: 'Parent comment not found' });
          }
          // Push the new comment's ID into the parent comment's replies array
          parentComment.repliesArray.push(savedComment._id);
          await parentComment.save(); // Save the updated parent comment
        }
          
          res.json({status:'success', data:populatedComment, message:'Commented successfully!'});
        

        } catch (error){
            console.log(error);
            res.json({ status:'error', message: 'Internal Server Error. Please Try Later'});
        
        }


}

exports.getCommentsCtrl = async(req, res) => {
  const {postId} = req.body
    try {
        const comments = await CommentsModel.find({postId})
          .populate({
            path: 'creatorMiniProfile',
            select: 'username dpPath _id',
          });

  
          const post = await PostsModel.findById(postId, { caption: 1 });
          const postCaption = post?.caption ? post.caption : '';

          //const commentAi = await commentsSummaryAI(postCaption, comments);
          const commentAi = '';
    
        return res.status(200).json({
          status:'success',
          data: comments,
          commentAI: commentAi,
          message: 'Comments fetched successfully'
        });
        
      } catch (error) {
        console.error('Error fetching Comments:', error);
        return res.status(500).json({
          status: 'error',
          message: 'Internal Server Error',
        });
      }
}


exports.getACommentCtrl = async(req, res) => {
  const {commentId} = req.body;
  
  try {
      const Comment = await CommentsModel.findById(commentId)
        .populate({
          path: 'creatorMiniProfile',
          select: 'username dpPath _id',
        });
  
      return res.status(200).json({
        status:'success',
        data: Comment,
        message: 'Comments fetched successfully'
      });
    } catch (error) {
      console.error('Error fetching Comments:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Internal Server Error',
      });
    }
}

exports.likeCommentCtrl = async (req, res) => {

  const { commentId, type, generalType} = req.body; // Make sure generalType is included
  const userId = req.userId; // Assuming the user ID is set in the request context

  try {
    // Find the Comment by ID
    const comment = await CommentsModel.findById(commentId);

    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (generalType === 'action') {
      const actionToArrayMap = {
        'VIEW_COMMENT': 'viewersArray',
        'LIKE_COMMENT': 'likersArray',
        'DISLIKE_COMMENT': 'dislikersArray',
        'REVIEW_COMMENT_COUNT': 'commentersArray',
      };

      const key = actionToArrayMap[type];

      if (key) {
        if (type === 'LIKE_COMMENT') {
          // If user has disliked the post, remove them from the dislikersArray
          await comment.updateOne({ $pull: { dislikersArray: userId } });

          // Check if user has already liked the post
          if (comment.likersArray.includes(userId)) {
            return res.status(400).json({ message: "User has already liked this comment" });
          }

          // Add the user to the likersArray
          comment.likersArray.push(userId);
        } 
        else if (type === 'DISLIKE_COMMENT') {
          // If user has liked the post, remove them from the likersArray
          await comment.updateOne({ $pull: { likersArray: userId } });

          // Check if user has already disliked the post
          if (comment.dislikersArray.includes(userId)) {
            return res.status(400).json({ message: "User has already disliked this comment" });
          }

          // Add the user to the dislikersArray
          comment.dislikersArray.push(userId);
        }
      }
    } else if (generalType === 'undo') {
      const undoToArrayMap = {
        'UNLIKE_COMMENT': 'likersArray',
        'UNDISLIKE_COMMENT': 'dislikersArray'
      };
      const undoKey = undoToArrayMap[type];

      if (undoKey) {
        // Remove the user from the corresponding array
        await comment.updateOne({ $pull: { [undoKey]: userId } });
      }
    }

    // Save the updated post
    await comment.save();
    return res.status(200).json({ status: 'success', message: "Success" });

  } catch (error) {

    console.error(error);
    return res.status(500).json({ status: 'error', message: "An error occurred" });

  }
}
exports.editCommentCtrl = async (req, res) => {
  const { commentId } = req.params; // Assuming commentId is passed in the URL params
  const userId = req.userId;

  try { 
    // Find the Comment by ID and update it
    const updatedComment = await CommentsModel.findByIdAndUpdate(
      commentId,
      {
        content: req.body.content, // Assuming captions are sent in the body
      },
      { new: true } // This option returns the updated document
    );

    if (!updatedComment) {
      return res.status(404).json({ status: 'error', message: 'Comment not found' });
    }

    res.json({ status: 'success', data: updatedComment, message: 'Comment updated successfully!' });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ status: 'error', message: 'Internal Server Error. Please try later' });
  }
};

exports.deleteCommentCtrl = async (req, res) => {
  const { commentId } = req.body; // Assuming commentId is passed in the URL params
  const userId = req.userId; // Assuming userId is set in the request context
  
  try {
    // Find the Comment by ID
    const Comment = await CommentsModel.findById(commentId);

    if (!Comment) {
      return res.status(404).json({ status: 'error', message: 'Comment not found' });
    }

    // Check if the user is the creator of the Comment
    if (Comment.creatorMiniProfile.toString() !== userId.toString()) {
      return res.status(403).json({ status: 'error', message: 'Unauthorized: You cannot delete this Comment' });
    }

    // Delete the Comment
    await CommentsModel.findByIdAndDelete(commentId);

    res.json({ status: 'success', message: 'Comment deleted successfully!' });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ status: 'error', message: 'Internal Server Error. Please try later' });
  }
};


