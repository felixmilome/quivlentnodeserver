
const { CommentsModel } = require( "../models/commentsModel");

exports.addCommentCtrl = async(req,res) => {
 

    try{
    
      const userId = req.userId;

        const newCommentData = {
            creatorMiniProfile: userId, 
            content: req.content
          };

          const newComment = new CommentsModel(newCommentData);
          const savedComment = await newComment.save();
          
          res.json({status:'success', data:savedComment, message:'Commented successfully!'});
        

        } catch (error){
            console.log(error.message);
            res.json({ status:'error', message: 'Internal Server Error. Please Try Later'});
        
        }


}

exports.getCommentsCtrl = async(req, res) => {
    try {
        const Comments = await CommentsModel.find()
          .populate({
            path: 'creatorMiniProfile',
            select: 'username dpPath _id',
          });
    
        return res.status(200).json({
          status:'success',
          data: Comments,
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
  const { commentId, type, generalType } = req.body; // Make sure generalType is included
  const userId = req.userId; // Assuming the user ID is set in the request context

  try {
    // Find the Comment by ID
    const Comment = await CommentsModel.findById(commentId);

    if (!Comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (generalType === 'action') {
      const actionToArrayMap = {
        'VIEW_COMMENT': 'viewersArray',
        'LIKE_COMMENT': 'likersArray',
        'DISLIKE_COMMENT': 'dislikersArray',
        'REVIEW_COMMENT_COUNT': 'commentersArray',
        'UNLIKE_COMMENT': 'likersArray',
        'UNDISLIKE_COMMENT': 'dislikersArray'
      };
      const key = actionToArrayMap[type];

      // Ensure key is valid before pushing
      if (key) {
        // Check if user already exists in the array (for LIKE and DISLIKE)
        if (type === 'LIKE_COMMENT' && Comment.likersArray.includes(userId)) {
          return res.status(400).json({ message: "User has already liked this Comment" });
        }
        if (type === 'DISLIKE_COMMENT' && Comment.dislikersArray.includes(userId)) {
          return res.status(400).json({ message: "User has already disliked this Comment" });
        }
        Comment[key].push(userId);
      }

    } else if (generalType === 'undo') {
      const undoToArrayMap = {
        'UNLIKE_COMMENT': 'likersArray',
        'UNDISLIKE_COMMENT': 'dislikersArray'
      };
      const undoKey = undoToArrayMap[type];

      // Ensure undoKey is valid before removing
      if (undoKey) {
        Comment[undoKey] = Comment[undoKey].filter(userIdInArray => userIdInArray.toString() !== userId.toString());
      }
    }

    // Save the updated Comment
    await Comment.save();

    return res.status(200).json({ status: 'success', message: "success" });
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


