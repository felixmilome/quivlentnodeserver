
const { PostsModel } = require( "../models/postsModel");
const {uploadFilesToFirebase} = require('../functions/filesHandler.js')

exports.addPostCtrl = async(req,res) => {
 

    try{
    
      const userId = req.userId;
      const captionsArr = JSON.parse(req.body.captions);
      console.log(captionsArr)
  
  

        const uploadedFilesInfo = await uploadFilesToFirebase(req.files, '/post', userId);
        const downloadURLs = uploadedFilesInfo.map(file => file.downloadURL);
        const newPostData = {
            creatorMiniProfile: userId, 
            captionsArray: captionsArr,
            filesArray: downloadURLs,
            creatorMiniProfile: userId, 
            publicity: 'PUBLIC',

          };

          const newPost = new PostsModel(newPostData);
          const savedPost = await newPost.save();
          
          res.json({status:'success', data:savedPost, message:'posted successfully!'});
        

        } catch (error){
            console.log(error);
            res.json({ status:'error', message: 'Internal Server Error. Please Try Later'});
        
       }


}

exports.getPostsCtrl = async(req, res) => {
    try {
        const posts = await PostsModel.find()
          .populate({
            path: 'creatorMiniProfile',
            select: 'username dpPath _id',
          });
    
        return res.status(200).json({
          status:'success',
          data: posts,
          message: 'posts fetched successfully'
        });
      } catch (error) {
        console.error('Error fetching posts:', error);
        return res.status(500).json({
          status: 'error',
          message: 'Internal Server Error',
        });
      }
}


exports.getAPostCtrl = async(req, res) => {
  const {postId} = req.body
  try {
      const post = await PostsModel.findById(postId)
        .populate({
          path: 'creatorMiniProfile',
          select: 'username dpPath _id',
        });
  
      return res.status(200).json({
        status:'success',
        data: post,
        message: 'posts fetched successfully'
      });
    } catch (error) {
      console.error('Error fetching posts:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Internal Server Error',
      });
    }
}

exports.likePostCtrl = async (req, res) => {
  const { postId, type, generalType } = req.body;
  const userId = req.userId;
  console.log(userId);
  try {
    // Find the post by ID
    const post = await PostsModel.findById(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (generalType === 'action') {
      const actionToArrayMap = {
        'VIEW_POST': 'viewersArray',
        'LIKE_POST': 'likersArray',
        'DISLIKE_POST': 'dislikersArray',
        'REVIEW_POST_COUNT': 'commentersArray'
      };
      const key = actionToArrayMap[type];

      if (key) {
        if (type === 'LIKE_POST') {
          // If user has disliked the post, remove them from the dislikersArray
          await post.updateOne({ $pull: { dislikersArray: userId } });

          // Check if user has already liked the post
          if (post.likersArray.includes(userId)) {
            return res.status(400).json({ message: "User has already liked this post" });
          }

          // Add the user to the likersArray
          post.likersArray.push(userId);
        } 
        else if (type === 'DISLIKE_POST') {
          // If user has liked the post, remove them from the likersArray
          await post.updateOne({ $pull: { likersArray: userId } });

          // Check if user has already disliked the post
          if (post.dislikersArray.includes(userId)) {
            return res.status(400).json({ message: "User has already disliked this post" });
          }

          // Add the user to the dislikersArray
          post.dislikersArray.push(userId);
        }
      }
    } else if (generalType === 'undo') {
      const undoToArrayMap = {
        'UNLIKE_POST': 'likersArray',
        'UNDISLIKE_POST': 'dislikersArray'
      };
      const undoKey = undoToArrayMap[type];

      if (undoKey) {
        // Remove the user from the corresponding array
        await post.updateOne({ $pull: { [undoKey]: userId } });
      }
    }

    // Save the updated post
    await post.save();

    return res.status(200).json({ status: 'success', message: "Success" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: 'error', message: "An error occurred" });
  }
}


exports.editPostCtrl = async (req, res) => {
  const { postId } = req.body; // Assuming postId is passed in the URL params
  const userId = req.userId;
  console.log('edit')
  const post = await PostsModel.findById(postId);

  if (!post) {
    return res.status(404).json({ status: 'error', message: 'Post not found' });
  }

  // Check if the user is the creator of the post to be corrected
  // if (post.creatorMiniProfile !== userId) {
  //   console.log('huraah')
  //   return res.status(403).json({ status: 'error', message: 'Unauthorized: You cannot delete this post' });
  // }

  try {
    // Find the post by ID and update it
    const updatedPost = await PostsModel.findByIdAndUpdate(
      postId,
      {
        captionsArray: req.body.captions, // Assuming captions are sent in the body
      },
      { new: true } // This option returns the updated document
    );

    if (!updatedPost) {
      return res.status(404).json({ status: 'error', message: 'Post not found' });
    }

    res.json({ status: 'success', data: updatedPost, message: 'Post updated successfully!' });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ status: 'error', message: 'Internal Server Error. Please try later' });
  }
};

exports.deletePostCtrl = async (req, res) => {
  const { postId } = req.body; // Assuming postId is passed in the URL params
  const userId = req.userId; // Assuming userId is set in the request context

  try {
    // Find the post by ID
    const post = await PostsModel.findById(postId);

    if (!post) {
      return res.status(404).json({ status: 'error', message: 'Post not found' });
    }

    // Check if the user is the creator of the post
    // if (post.creatorMiniProfile !== userId) {
    //   console.log('noo')
    //   return res.status(403).json({ status: 'error', message: 'Unauthorized: You cannot delete this post' });
    // }

    // Delete the post
    await PostsModel.findByIdAndDelete(postId);

    res.json({ status: 'success', message: 'Post deleted successfully!' });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ status: 'error', message: 'Internal Server Error. Please try later' });
  }
};


