
const { PostsModel } = require( "../models/postsModel");
const {uploadFilesToFirebase} = require('../functions/filesHandler.js')

const postViewerPopulationData = '_id username dpPath gender region coordinates dateOfBirth'

exports.addPostCtrl = async(req,res) => {
 

    try{
    
      const userId = req.userId;
      const captionsArr = JSON.parse(req.body.captions);
      const title = JSON.parse(req.body.title);
       
  
  

        const uploadedFilesInfo = await uploadFilesToFirebase(req.files, '/post', userId);
        const downloadURLs = uploadedFilesInfo.map(file => file.downloadURL);

        const miniPostsArray = captionsArr?.length>0 ? 
          captionsArr.map((caption, index) => ({
            indexId:index,
            caption,
            noneRating:false,
            imageUrl: downloadURLs[index] || null, // Ensure pairing even if the image count is less than captions
          }))
        :[];

        captionsArr?.length>0 && miniPostsArray.push({
          indexId: captionsArr?.length, //will set index last automatically
          caption: "none of the above",
          noneRating:true,
          imageUrl: null,  // Set to null or any other default value if no image is needed
        });

        const newPostData = {
            creatorMiniProfile: userId, 
            title,
            miniPostsArray,
            // captionsArray: captionsArr,
            // filesArray: downloadURLs,
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

      if(req.body?.type === 'userProfile'){ 

        const {userId} = req.body;

        const posts = await PostsModel.find({ creatorMiniProfile: userId })
        .populate({
          path: 'creatorMiniProfile',
          select: 'username dpPath _id', //blocked array not necessary since blocking occurs during profile fetch
        })
        .populate({
          path: 'viewersArray',
          model: 'UsersModel',
          select: postViewerPopulationData, // Select the fields you need for viewers
        }) .sort({ createdTime: -1 }); ;
  
      return res.status(200).json({
        status:'success',
        data: posts,
        message: 'posts fetched successfully'
      });

    } 

        const posts = await PostsModel.find()
          .populate({
            path: 'creatorMiniProfile',
            select: 'username dpPath _id blockedArray',
          }).populate({
            path: 'viewersArray',
            model: 'UsersModel',
            select: postViewerPopulationData, // Select the fields you need for viewers
          }) .sort({ createdTime: -1 }); ;
    
    
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
          select: 'username dpPath _id blockedArray',
        }).populate({
          path: 'viewersArray',
          model: 'UsersModel',
          select: postViewerPopulationData, // Select the fields you need for viewers
        });
  ;
  
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
        'REVIEW_POST_COUNT': 'commentersArray',
        'VIEW_POST': 'viewersArray'
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
        }else if(type === 'VIEW_POST') {

          if (!post.viewersArray.includes(userId)) {

            post.viewersArray.push(userId);
            await post.save();
            return res.status(200).json({ status: 'success', message: "Viewed" });

          }else{

            return res.status(200).json({ message: "AlreadyViewed" });
            
          }
          // Add the user to the likersArray
      
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
// exports.rateMiniPostCtrl = async (req, res) => {
//   try {

//     const {postId, miniPostIndex} = req.body;
//     const result = await PostsModel.updateOne(
//       { _id: postId, 'miniPostsArray.indexId': miniPostIndex },
//       { $push: { 'miniPostsArray.$.ratingsArray': req.userId } }
//     );
//     console.log(result)
//     return res.status(200).json({ status: 'success'});

//   } catch (error) {
//     console.error("Error updating ratingsArray:", error);
//     throw error;
//   }
// };

exports.rateMiniPostCtrl = async (req, res) => {
  try {
    const { postId, miniPostIndex, noneVote } = req.body;
    const userId = req.userId;



    const post = await PostsModel.findOne({
      _id: postId,
      'miniPostsArray.indexId': miniPostIndex,
    });

    if (!post) {
      return res.status(404).json({ status: 'error', message: 'Post or mini post not found' });
    }

  
    // Find the mini post within the post
    const miniPost = post.miniPostsArray.find(mp => mp.indexId === miniPostIndex);

    if (!miniPost) {
      return res.status(404).json({ status: 'error', message: 'Mini post not found' });
    }

    const isRated = miniPost.ratingsArray.includes(userId);
    let action;
    
    if (isRated) {
   
      // If the user is already rated, pull (remove) the userId
      await PostsModel.findByIdAndUpdate(
        postId,
        {
          $pull: { 'miniPostsArray.$[elem].ratingsArray': userId },  // Pull from the specific mini post's ratingsArray
        },
        {
          arrayFilters: [{ 'elem.indexId': miniPostIndex }]  // Ensure we're targeting the correct mini post
        }
      );
      action = 'unrated'; 
    } else {
      // If noneVote is true, remove user's rating from all other mini posts
      // if (noneVote) {
        await PostsModel.findByIdAndUpdate(
          postId,
          {
            $pull: {
              'miniPostsArray.$[].ratingsArray': userId, // Pull from all mini posts except the one being rated
            },
          }
        );
      // }
    
      // Push (add) the userId to the specific mini post
      await PostsModel.findByIdAndUpdate(
        postId,  // Using postId directly
        {
          $push: {
            'miniPostsArray.$[elem].ratingsArray': userId  // Push the userId to the specific mini post's ratingsArray
          }
        },
        {
          arrayFilters: [{ 'elem.indexId': miniPostIndex }]  // Ensuring the update targets the correct mini post
        }
      );
      
      action = noneVote ? 'nonerate' : 'rated';
    }
    


    return res.status(200).json({
      status: 'success',
      message: action,
    });

  } catch (error) {
    console.error('Error updating ratingsArray:', error);
    return res.status(500).json({
      status: 'error',
      message: 'An error occurred while updating ratingsArray.',
    });
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


