const {UsersModel} = require('../models/usersModel'); // Adjust the path as needed
const {PostsModel} = require('../models/postsModel');

exports.searchCtrl = async (req, res) => {
    try {
         const { searchTerm } = req.body;
      
       // console.log(req.body);
 

        if (!searchTerm) {
            return res.status(400).json({ message: "Search searchTerm is required" });
        }

        // Search in UsersModel for matching username
        const users = await UsersModel.find({ 
            username: { $regex: searchTerm, $options: 'i' } // Case-insensitive search
        }).select('_id username dpPath').limit(5); // Select only the fields you want

      // Search in PostsModel for matching title
        const posts = await PostsModel.find({
            title: { $regex: searchTerm, $options: 'i' } // Case-insensitive search
        })
        .limit(10) // Limit the results to 10 before populating
        .populate({
            path: 'creatorMiniProfile',
            select: 'username dpPath _id',
        });

        res.status(200).json( {status:'success', data:{ users, posts }});

    } catch (error) {
        console.error("Error during search:", error);
        res.status(200).json( {status:'error'});
    }
};


