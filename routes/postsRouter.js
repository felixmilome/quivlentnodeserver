const express = require('express');
const {addPostCtrl, getPostsCtrl,
     getAPostCtrl, likePostCtrl, 
     editPostCtrl, deletePostCtrl, rateMiniPostCtrl
    } = require('../controllers/postsController.js');
const {
addCommentCtrl, getACommentCtrl,
 getCommentsCtrl, editCommentCtrl,
deleteCommentCtrl, likeCommentCtrl
}= require('../controllers/commentsController.js');
const {multerUpload} = require("../middleware/multer.js");
const {auth} = require("../middleware/authMiddleware.js")

const postsRouter = express.Router(); 

postsRouter.post ('/addPost', auth, multerUpload.array("files"), addPostCtrl);
postsRouter.post ('/getPosts', getPostsCtrl);
postsRouter.post ('/getAPost', getAPostCtrl);
postsRouter.post ('/likePost',auth, likePostCtrl);
postsRouter.post ('/rateMiniPost',auth, rateMiniPostCtrl);
postsRouter.post ('/editPost',auth, editPostCtrl);
postsRouter.post ('/deletePost',auth, deletePostCtrl);

postsRouter.post ('/getComments', getCommentsCtrl);
postsRouter.post ('/addComment', auth, addCommentCtrl);
postsRouter.post ('/likeComment', auth, likeCommentCtrl);
postsRouter.post ('/editComment', auth, editCommentCtrl);
postsRouter.post ('/deleteComment', auth, deleteCommentCtrl);


 

module.exports = postsRouter;